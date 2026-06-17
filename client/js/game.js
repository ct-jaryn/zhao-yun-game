import { W, H, MAP_W, MAP_H, SKILLS, REWARD_TYPES } from './config.js';
import { Player, genEquip, equipPower, equipStatText, createInitialEquip } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { Particle } from './entities/particle.js';
import { FloatingText } from './entities/floatingText.js';
import { DropItem } from './entities/dropItem.js';
import { UI } from './ui.js';
import * as Renderer from './renderer.js';
import { updateScreenShake, shakeScreen, flashScreen, rand, randInt, pick, vdist, vec, vsub, vnorm } from './utils.js';

export class Game {
  constructor(savedData = null) {
    this.player = new Player(MAP_W / 2, MAP_H / 2);
    this.enemies = [];
    this.particles = [];
    this.texts = [];
    this.projectiles = [];
    this.drops = [];
    this.cam = { x: 0, y: 0 };
    // 新关卡流程：击败20个曹兵 → 曹操 → 狂暴曹操 + 吕布
    this.phase = 'soldiers';
    this.soldierKills = 0;
    this.soldiersRequired = 20;
    this.caocaoDefeated = false;
    this.enhancedCaocaoDefeated = false;
    this.lubuDefeated = false;
    this.autoSpawnTimer = 0;
    this.autoSpawnInterval = 1.2;
    this.totalKills = 0;
    this.score = 0;
    this.gameTime = 0;
    this.running = true;
    this.paused = false;
    this.equipPanelOpen = false;
    this.levelUpOpen = false;
    this.killLog = [];
    this.nearestDrop = null;
    this.pendingRewards = [];
    this.lastKillMilestone = 0;

    this.ui = new UI(this);

    if (savedData) this.loadSave(savedData);
    else this.startLevel();
  }

  loadSave(data) {
    Object.assign(this.player, data.player);
    // 兼容旧存档：补齐缺失的装备槽位
    if (!this.player.equip) this.player.equip = createInitialEquip();
    for (const type of ['武器', '铠甲', '头盔', '靴子', '饰品']) {
      if (!this.player.equip[type]) this.player.equip[type] = createInitialEquip()[type];
    }
    this.score = data.score || 0;
    this.gameTime = data.gameTime || 0;
    this.totalKills = data.totalKills || 0;
    this.lastKillMilestone = Math.floor(this.totalKills / 100) * 100;
    this.phase = data.phase || 'soldiers';
    this.soldierKills = data.soldierKills || 0;
    this.caocaoDefeated = data.caocaoDefeated || false;
    this.enhancedCaocaoDefeated = data.enhancedCaocaoDefeated || false;
    this.lubuDefeated = data.lubuDefeated || false;
    this.startLevel();
  }

  shakeScreen(intensity) { shakeScreen(intensity); }
  flashScreen(color, duration) { flashScreen(color, duration); }

  addParticles(x, y, color, count, speed, size) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(speed * 0.3, speed);
      this.particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, rand(0.3, 0.8), size || rand(2, 5)));
    }
  }

  addText(x, y, text, color, size, outline) {
    this.texts.push(new FloatingText(x, y, text, color, size, outline));
  }

  showWaveAnnounce(num, sub) {
    const el = document.getElementById('waveAnnounce');
    document.getElementById('waNum').textContent = num > 0 ? `第 ${num} 波` : '关卡进度';
    document.getElementById('waSub').textContent = sub || '';
    el.style.display = 'block';
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'waveAnnounce 2.5s ease forwards';
    setTimeout(() => el.style.display = 'none', 2500);
  }

  addKillLog(text) {
    this.killLog.unshift({ text, time: 4 });
    if (this.killLog.length > 6) this.killLog.pop();
  }

  getEnemyLevel(type) {
    // 新流程：曹操Lv.3，狂暴曹操/吕布Lv.5，小兵随时间小幅成长
    if (type === 'lubu') return 5;
    if (type === 'boss') return 3;
    const minutes = Math.floor(this.gameTime / 60);
    const maxLevel = type === 'cavalry' ? 5 : 3;
    return Math.min(maxLevel, 1 + minutes);
  }

  startLevel() {
    // 根据当前阶段恢复对应敌人
    if (this.phase === 'caocao') this.spawnCaocao();
    else if (this.phase === 'final') this.spawnFinalBosses();
    else this.showWaveAnnounce(0, '击败20个曹兵，引出曹操！');
  }

  spawnPhaseMinions() {
    // 清兵 / 曹操 / 最终阶段都持续刷小兵，确保战斗不停
    const isSoldiers = this.phase === 'soldiers';
    const isCaocao = this.phase === 'caocao';
    const isFinal = this.phase === 'final';
    if (!isSoldiers && !isCaocao && !isFinal) return;

    const maxMinions = 30;
    const aliveMinions = this.enemies.filter(e => !e.dead && e.type !== 'boss' && e.type !== 'lubu').length;
    if (aliveMinions >= maxMinions) return;

    const pos = this.randomSpawnPos();
    const r = Math.random();
    let type;
    if (isSoldiers) {
      type = r < 0.35 ? 'soldier' : (r < 0.70 ? 'archer' : 'cavalry');
    } else if (isCaocao) {
      type = r < 0.30 ? 'soldier' : (r < 0.65 ? 'archer' : 'cavalry');
    } else {
      type = r < 0.25 ? 'soldier' : (r < 0.60 ? 'archer' : 'cavalry');
    }
    this.enemies.push(new Enemy(pos.x, pos.y, type, this.getEnemyLevel(type)));
  }

  spawnCaocao() {
    this.phase = 'caocao';
    const pos = this.randomBossSpawnPos();
    const caocao = new Enemy(pos.x, pos.y, 'boss', this.getEnemyLevel('boss'), { skipRevive: true });
    this.enemies.push(caocao);
    this.showWaveAnnounce(0, '⚠ 曹操 来袭!');
    this.addKillLog('曹操出现！');
    this.addText(this.player.x, this.player.y - 80, '曹操出现！', '#ff44ff', 24, '#000');
    this.shakeScreen(6);
  }

  spawnFinalBosses() {
    this.phase = 'final';
    const pos1 = this.randomBossSpawnPos();
    const pos2 = this.randomBossSpawnPos();
    const enhanced = new Enemy(pos1.x, pos1.y, 'boss', 5, { enhanced: true, skipRevive: true });
    const lubu = new Enemy(pos2.x, pos2.y, 'lubu', 5, { skipRevive: true });
    this.enemies.push(enhanced);
    this.enemies.push(lubu);
    this.showWaveAnnounce(0, '⚠ 曹操·狂暴 & 吕布 同时来袭!');
    this.addKillLog('狂暴曹操与吕布同时降临！');
    this.addText(this.player.x, this.player.y - 90, '曹操·狂暴 & 吕布 同时降临！', '#ff0000', 28, '#000');
    this.shakeScreen(10);
    this.flashScreen('rgba(255,0,0,0.5)', 0.6);
    this.addParticles(this.player.x, this.player.y, '#ff44ff', 50, 200);
  }

  checkFinalVictory() {
    if (this.enhancedCaocaoDefeated && this.lubuDefeated) {
      this.gameWin();
    }
  }

  randomSpawnPos() {
    const side = randInt(0, 3);
    const margin = 150;
    switch (side) {
      case 0: return { x: rand(margin, MAP_W - margin), y: rand(margin, margin + 200) };
      case 1: return { x: rand(margin, MAP_W - margin), y: rand(MAP_H - margin - 200, MAP_H - margin) };
      case 2: return { x: rand(margin, margin + 200), y: rand(margin, MAP_H - margin) };
      default: return { x: rand(MAP_W - margin - 200, MAP_W - margin), y: rand(margin, MAP_H - margin) };
    }
  }

  onEnemyKilled(e) {
    // Boss 处理
    if (e.type === 'boss') {
      this.totalKills++;
      this.checkKillMilestone();
      this.score += e.score;
      if (e.enhanced) {
        // 狂暴曹操击败
        this.enhancedCaocaoDefeated = true;
        this.rewardBossKill(e, false);
        this.addKillLog('曹操·狂暴 被击败！');
        this.addText(e.x, e.y - e.radius - 50, '曹操·狂暴 被击败！', '#ff0000', 26, '#000');
        this.checkFinalVictory();
        return;
      }
      // 普通曹操击败 → 进入狂暴曹操+吕布阶段
      this.caocaoDefeated = true;
      this.rewardBossKill(e, false);
      this.addKillLog('曹操败退！狂暴曹操与吕布同时降临！');
      this.addText(e.x, e.y - e.radius - 50, '曹操败退！狂暴曹操与吕布同时降临！', '#ff0000', 28, '#000');
      this.shakeScreen(10);
      this.flashScreen('rgba(255,0,0,0.5)', 0.6);
      this.spawnFinalBosses();
      return;
    }

    // 吕布击败
    if (e.type === 'lubu') {
      this.totalKills++;
      this.checkKillMilestone();
      this.score += e.score;
      this.lubuDefeated = true;
      this.rewardBossKill(e, false);
      this.addKillLog('吕布被击败！');
      this.addText(e.x, e.y - e.radius - 50, '吕布被击败！', '#ff0000', 28, '#000');
      this.checkFinalVictory();
      return;
    }

    // 普通敌人
    this.totalKills++;
    this.checkKillMilestone();
    const comboBonus = 1 + Math.floor(this.player.combo / 5) * 0.2;
    this.score += Math.floor(e.score * comboBonus);
    this.player.addExp(e.exp, this);
    this.addKillLog(`击杀 Lv.${e.level} ${e.name} +${e.score}分`);
    this.addParticles(e.x, e.y, '#ff4444', 15, 110);

    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push(new Particle(e.x, e.y, Math.cos(a) * 80, Math.sin(a) * 80, pick(['#ff6644','#ffaa44','#ff4422']), rand(0.4, 0.8), rand(3, 7)));
    }

    if (Math.random() < e.dropRate) {
      const eq = genEquip(Math.max(1, this.player.level));
      this.drops.push(new DropItem(e.x, e.y, eq));
    }

    // 小兵击杀计数（枪兵/弓箭手/骑兵），达到20个触发曹操
    const MINION_TYPES = ['soldier', 'archer', 'cavalry'];
    if (MINION_TYPES.includes(e.type)) {
      this.soldierKills++;
      if (this.phase === 'soldiers' && this.soldierKills >= this.soldiersRequired) {
        this.spawnCaocao();
      }
    }
  }

  getKillMilestoneTitle(kills) {
    const titles = {
      100: '一骑当千',
      200: '锐不可当',
      300: '所向披靡',
      400: '横扫千军',
      500: '万人敌',
      600: '神勇无双',
      700: '霸气纵横',
      800: '修罗降世',
      900: '九天揽月',
      1000: '千古传奇'
    };
    return titles[kills] || (kills >= 1000 ? '传说再临' : '勇冠三军');
  }

  checkKillMilestone() {
    const milestone = Math.floor(this.totalKills / 100) * 100;
    if (milestone > 0 && milestone > this.lastKillMilestone) {
      this.lastKillMilestone = milestone;
      this.showKillMilestone(milestone);
    }
  }

  showKillMilestone(kills) {
    const title = this.getKillMilestoneTitle(kills);
    const el = document.getElementById('killMilestone');
    document.getElementById('kmText').textContent = `${kills}斩`;
    document.getElementById('kmSub').textContent = title;

    // 强烈视觉冲击
    this.shakeScreen(16);
    this.flashScreen('rgba(255,160,40,0.45)', 0.55);

    // 粒子爆发
    const p = this.player;
    const colors = ['#ffd700', '#ff4422', '#ffaa44', '#ff6644', '#fff5c8'];
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(120, 320);
      this.particles.push(new Particle(p.x, p.y, Math.cos(a) * s, Math.sin(a) * s, pick(colors), rand(0.6, 1.4), rand(3, 9)));
    }
    // 向上飘散的火星
    for (let i = 0; i < 30; i++) {
      const x = p.x + rand(-120, 120);
      const y = p.y + rand(-80, 80);
      this.particles.push(new Particle(x, y, rand(-30, 30), rand(-180, -60), pick(['#ffd700','#ffaa44','#ff6644']), rand(0.8, 1.6), rand(2, 5)));
    }

    // 浮动文字
    this.addText(p.x, p.y - 110, `★ ${kills}斩 · ${title} ★`, '#ffd700', 30, '#000');
    this.addKillLog(`★ ${kills}斩 · ${title} ★`);

    // DOM 动画触发
    el.style.display = 'block';
    el.classList.remove('active');
    void el.offsetWidth;
    el.classList.add('active');
    setTimeout(() => {
      el.classList.remove('active');
      el.style.display = 'none';
    }, 2400);
  }

  randomBossSpawnPos() {
    const margin = 200;
    const p = this.player;
    const side = randInt(0, 3);
    switch (side) {
      case 0: return { x: rand(margin, MAP_W - margin), y: Math.max(margin, p.y - 500) };
      case 1: return { x: rand(margin, MAP_W - margin), y: Math.min(MAP_H - margin, p.y + 500) };
      case 2: return { x: Math.max(margin, p.x - 500), y: rand(margin, MAP_H - margin) };
      default: return { x: Math.min(MAP_W - margin, p.x + 500), y: rand(margin, MAP_H - margin) };
    }
  }

  rewardBossKill(boss, isFinal = false) {
    // 击败Boss直接升一级
    this.player.addExp(this.player.expToLevel, this);
    this.addText(this.player.x, this.player.y - 90, isFinal ? '通关奖励：等级提升！' : '击败Boss：等级提升！', '#ffd700', 22, '#000');

    // 每个Boss只掉落1件装备
    const dropCount = 1;
    for (let i = 0; i < dropCount; i++) {
      const eq = genEquip(Math.max(1, this.player.level + (isFinal ? 2 : 0)));
      const angle = Math.random() * Math.PI * 2;
      const dist = rand(20, 80);
      this.drops.push(new DropItem(boss.x + Math.cos(angle) * dist, boss.y + Math.sin(angle) * dist, eq));
    }
    this.addText(boss.x, boss.y - boss.radius - 55, `掉落 ${dropCount} 件装备！`, '#ffaa44', 18, '#000');
  }

  onBossFirstDeath(boss) {
    this.rewardBossKill(boss, false);
    this.addText(boss.x, boss.y - boss.radius - 40, '曹操倒下，60秒后复活！', '#ff44ff', 24, '#000');
    this.addKillLog('曹操倒下，正在积蓄力量…');
    this.shakeScreen(8);
    this.flashScreen('rgba(150,0,150,0.4)', 0.4);
    this.addParticles(boss.x, boss.y, '#ff44ff', 40, 160);
  }

  onBossRevived(boss) {
    this.addText(boss.x, boss.y - boss.radius - 40, '曹操复活！力量翻倍！', '#ff2222', 26, '#000');
    this.addKillLog('曹操复活，变得更加强大！');
    this.shakeScreen(10);
    this.flashScreen('rgba(255,0,0,0.5)', 0.5);
    this.addParticles(boss.x, boss.y, '#ff0000', 50, 200);
    // 复活后满血并刷新血条显示
    boss.hp = boss.maxHp;
  }

  checkNearestDrop() {
    const p = this.player;
    let nearest = null, nearDist = 60;
    for (const d of this.drops) {
      const dist = vdist(vec(p.x, p.y), vec(d.x, d.y));
      if (dist < nearDist) { nearest = d; nearDist = dist; }
    }
    this.nearestDrop = nearest;
  }

  autoPickupDrops() {
    const p = this.player;
    const pickupRadius = p.radius + 24;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (d.life <= 0) continue;
      const dist = vdist(vec(p.x, p.y), vec(d.x, d.y));
      if (dist < pickupRadius) {
        this.pickupDrop(d);
      }
    }
  }

  shouldEquip(eq, old) {
    return equipPower(eq) > equipPower(old);
  }

  pickupDrop(drop = null) {
    const d = drop || this.nearestDrop;
    if (!d) return;
    const eq = d.equip;
    const slot = eq.type;
    const old = this.player.equip[slot];
    const equipped = !old || this.shouldEquip(eq, old);
    if (equipped) {
      this.player.equip[slot] = eq;
      this.addText(this.player.x, this.player.y - 50, `装备 ${eq.name}`, eq.quality.color, 16, '#000');
      if (slot === '铠甲' || slot === '头盔' || slot === '饰品') {
        this.player.hp = Math.min(this.player.hp + 20, this.player.maxHpTotal);
      }
      // 拾取赵云最强一套（tier 4）时额外提醒
      if (eq.tier === 4) {
        this.addText(this.player.x, this.player.y - 90, `✨ 获得最终装备：${eq.name}！`, '#ffd700', 26, '#000');
        this.addKillLog(`获得最终装备：${eq.name}`);
        this.shakeScreen(4);
        this.flashScreen('rgba(255,215,0,0.25)', 0.3);
        this.addParticles(this.player.x, this.player.y, '#ffd700', 20, 120);
      }
    } else {
      this.addText(this.player.x, this.player.y - 50, `${eq.name} 不如当前装备`, '#888', 12, null);
    }
    const idx = this.drops.indexOf(d);
    if (idx >= 0) this.drops.splice(idx, 1);
    if (!drop) this.nearestDrop = null;
  }

  showLevelUp() {
    this.paused = true;
    this.levelUpOpen = true;
    const pool = [...REWARD_TYPES];
    const rewards = [];
    while (rewards.length < 3 && pool.length > 0) {
      const idx = randInt(0, pool.length - 1);
      rewards.push(pool.splice(idx, 1)[0]);
    }
    this.pendingRewards = rewards;
    this.ui.showLevelUp(rewards, (r) => {
      r.apply(this.player);
      this.addText(this.player.x, this.player.y - 60, r.name, '#ffd700', 18, '#000');
      this.levelUpOpen = false;
      this.paused = false;
    });
  }

  update(dt, keys, mouse) {
    if (!this.running || this.paused || this.levelUpOpen) return;
    this.gameTime += dt;
    updateScreenShake(dt);

    // Handle mouse movement target
    if (this.player.moveTarget) {
      const p = this.player;
      const dist = vdist(vec(p.x, p.y), vec(p.moveTarget.x, p.moveTarget.y));
      if (dist > 5) {
        const dir = vnorm(vsub(vec(p.moveTarget.x, p.moveTarget.y), vec(p.x, p.y)));
        p.x += dir.x * p.speedTotal * dt;
        p.y += dir.y * p.speedTotal * dt;
        p.dir = Math.atan2(dir.y, dir.x);
      } else {
        p.moveTarget = null;
      }
    }

    this.player.update(dt, keys, mouse, this);

    // Trigger game over after death animation finishes
    if (this.player.dead && this.player.deathAnimTimer <= 0) {
      this.gameOver();
      return;
    }

    const lookAhead = 60;
    const targetX = this.player.x + Math.cos(this.player.dir) * lookAhead - W / 2;
    const targetY = this.player.y + Math.sin(this.player.dir) * lookAhead - H / 2;
    this.cam.x += (targetX - this.cam.x) * 4 * dt;
    this.cam.y += (targetY - this.cam.y) * 4 * dt;
    this.cam.x = Math.max(0, Math.min(MAP_W - W, this.cam.x));
    this.cam.y = Math.max(0, Math.min(MAP_H - H, this.cam.y));

    for (const e of this.enemies) e.update(dt, this);
    this.enemies = this.enemies.filter(e => !e.dead || e.deathTimer > 0);

    for (const p of this.projectiles) {
      p.update(dt);
      if (p.owner === 'player') {
        for (const e of this.enemies) {
          if (e.dead || p.hit.has(e)) continue;
          if (vdist(vec(p.x, p.y), vec(e.x, e.y)) < e.radius + p.size) {
            e.takeDamage(p.dmg, false, p.dir, this);
            p.hit.add(e);
            p.life = 0;
          }
        }
      } else {
        if (vdist(vec(p.x, p.y), vec(this.player.x, this.player.y)) < this.player.radius + p.size) {
          this.player.takeDamage(p.dmg, this);
          p.life = 0;
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0);

    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => p.life > 0);
    for (const t of this.texts) t.update(dt);
    this.texts = this.texts.filter(t => t.life > 0);
    for (const d of this.drops) d.update(dt);
    this.drops = this.drops.filter(d => d.life > 0);

    for (const k of this.killLog) k.time -= dt;
    this.killLog = this.killLog.filter(k => k.time > 0);

    this.autoPickupDrops();
    this.checkNearestDrop();

    // 阶段化刷怪：清兵阶段刷枪兵，最终阶段刷小怪助兴
    this.autoSpawnTimer -= dt;
    if (this.autoSpawnTimer <= 0) {
      this.autoSpawnTimer = this.autoSpawnInterval;
      this.spawnPhaseMinions();
    }

    this.ui.update();
  }

  draw() {
    Renderer.clear();
    Renderer.drawBackground(this.cam);

    for (const d of this.drops) d.draw(window.ctx, this.cam);
    for (const e of this.enemies) if (e.dead) e.draw(window.ctx, this.cam);
    for (const e of this.enemies) if (!e.dead) e.draw(window.ctx, this.cam);
    this.player.draw(window.ctx, this.cam);
    for (const p of this.projectiles) p.draw(window.ctx, this.cam);
    for (const p of this.particles) p.draw(window.ctx, this.cam);
    for (const t of this.texts) t.draw(window.ctx, this.cam);

    Renderer.drawDirectionHints(this.cam, this.enemies);
    Renderer.restore();
    Renderer.drawMinimap(this.player, this.cam, this.enemies, this.drops);
  }

  getPhaseName() {
    const names = { soldiers: '清兵阶段', caocao: '曹操', final: '双Boss', victory: '通关' };
    return names[this.phase] || this.phase;
  }

  gameOver() {
    if (!this.running) return;
    this.running = false;
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('finalKills').textContent = this.totalKills;
    document.getElementById('finalCombo').textContent = this.player.maxCombo;
    document.getElementById('finalScore').textContent = Math.floor(this.score);
    const m = Math.floor(this.gameTime / 60), s = Math.floor(this.gameTime % 60);
    document.getElementById('finalTime').textContent = `${m}分${s}秒`;
    document.getElementById('finalWave').textContent = this.getPhaseName();
    document.getElementById('finalLevel').textContent = this.player.level;
  }

  gameWin() {
    if (!this.running) return;
    this.phase = 'victory';
    this.running = false;
    document.getElementById('victoryScreen').style.display = 'flex';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('winKills').textContent = this.totalKills;
    document.getElementById('winCombo').textContent = this.player.maxCombo;
    document.getElementById('winScore').textContent = Math.floor(this.score);
    const m = Math.floor(this.gameTime / 60), s = Math.floor(this.gameTime % 60);
    document.getElementById('winTime').textContent = `${m}分${s}秒`;
    document.getElementById('winWave').textContent = this.getPhaseName();
    document.getElementById('winLevel').textContent = this.player.level;
    this.addText(this.player.x, this.player.y - 80, '通关！曹操与吕布皆已被击败！', '#ffd700', 32, '#000');
    this.shakeScreen(12);
    this.flashScreen('rgba(255,215,0,0.6)', 0.8);
  }

  getSaveData() {
    return {
      player: {
        x: this.player.x, y: this.player.y, dir: this.player.dir,
        level: this.player.level, exp: this.player.exp, expToLevel: this.player.expToLevel,
        hp: this.player.hp, maxHp: this.player.maxHp,
        mp: this.player.mp, maxMp: this.player.maxMp,
        baseAtk: this.player.baseAtk, baseDef: this.player.baseDef,
        critRate: this.player.critRate, mpRegen: this.player.mpRegen,
        equip: this.player.equip,
        bonusAtk: this.player.bonusAtk, bonusCrit: this.player.bonusCrit,
        bonusSpd: this.player.bonusSpd, bonusCdr: this.player.bonusCdr,
        bonusHp: this.player.bonusHp, bonusMpRegen: this.player.bonusMpRegen,
        combo: this.player.combo, maxCombo: this.player.maxCombo
      },
      phase: this.phase,
      soldierKills: this.soldierKills,
      caocaoDefeated: this.caocaoDefeated,
      enhancedCaocaoDefeated: this.enhancedCaocaoDefeated,
      lubuDefeated: this.lubuDefeated,
      score: this.score,
      gameTime: this.gameTime,
      totalKills: this.totalKills
    };
  }
}
