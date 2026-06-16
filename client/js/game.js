import { W, H, MAP_W, MAP_H, SKILLS, REWARD_TYPES } from './config.js';
import { Player, genEquip, equipPower, equipStatText } from './entities/player.js';
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
    this.wave = 0;
    this.waveTimer = 3;
    this.autoSpawnTimer = 0;
    this.autoSpawnInterval = 2;
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

    this.ui = new UI(this);

    if (savedData) this.loadSave(savedData);
    else this.spawnWave();
  }

  loadSave(data) {
    Object.assign(this.player, data.player);
    this.score = data.score || 0;
    this.gameTime = data.gameTime || 0;
    this.totalKills = data.totalKills || 0;
    this.spawnWave(data.wave || 1);
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
    document.getElementById('waNum').textContent = `第 ${num} 波`;
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

  spawnWave(forceWave = null) {
    if (forceWave !== null) this.wave = forceWave;
    else this.wave++;
    const base = 15 + this.wave * 5;
    const bossWave = this.wave === 1 || this.wave % 5 === 0;
    this.showWaveAnnounce(this.wave, bossWave ? '⚠ Boss 来袭!' : '消灭所有敌人!');

    for (let i = 0; i < base; i++) {
      const pos = this.randomSpawnPos();
      let type = 'soldier';
      const roll = Math.random();
      if (this.wave >= 2 && roll < 0.3) type = 'archer';
      if (this.wave >= 3 && roll < 0.15) type = 'cavalry';
      if (this.wave >= 5 && roll < 0.08) type = 'general';
      this.enemies.push(new Enemy(pos.x, pos.y, type, this.wave));
    }

    if (bossWave) {
      const bx = Math.max(100, Math.min(MAP_W - 100, this.player.x + rand(-300, 300)));
      const by = Math.max(100, Math.min(MAP_H - 100, this.player.y - 400));
      this.enemies.push(new Enemy(bx, by, 'boss', this.wave));
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
    this.totalKills++;
    const comboBonus = 1 + Math.floor(this.player.combo / 5) * 0.2;
    this.score += Math.floor(e.score * comboBonus);
    this.player.addExp(e.exp, this);
    this.addKillLog(`击杀 ${e.name} +${e.score}分`);
    this.addParticles(e.x, e.y, '#ff4444', 15, 110);

    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push(new Particle(e.x, e.y, Math.cos(a) * 80, Math.sin(a) * 80, pick(['#ff6644','#ffaa44','#ff4422']), rand(0.4, 0.8), rand(3, 7)));
    }

    if (Math.random() < e.dropRate) {
      const eq = genEquip(this.wave);
      this.drops.push(new DropItem(e.x, e.y, eq));
    }
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
    if (!old || this.shouldEquip(eq, old)) {
      this.player.equip[slot] = eq;
      this.addText(this.player.x, this.player.y - 50, `装备 ${eq.name}`, eq.quality.color, 16, '#000');
      if (slot === '铠甲' || slot === '头盔' || slot === '饰品') {
        this.player.hp = Math.min(this.player.hp + 20, this.player.maxHpTotal);
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

    // 自动补充小兵：场上存活敌人少于阈值时持续生成
    this.autoSpawnTimer -= dt;
    if (this.autoSpawnTimer <= 0) {
      this.autoSpawnTimer = this.autoSpawnInterval;
      const aliveCount = this.enemies.filter(e => !e.dead).length;
      const minEnemies = 12 + this.wave * 3;
      const maxEnemies = 40 + this.wave * 6;
      if (aliveCount < minEnemies) {
        const toSpawn = Math.min(6, maxEnemies - aliveCount);
        for (let i = 0; i < toSpawn; i++) {
          const pos = this.randomSpawnPos();
          let type = 'soldier';
          const roll = Math.random();
          if (this.wave >= 2 && roll < 0.3) type = 'archer';
          if (this.wave >= 3 && roll < 0.15) type = 'cavalry';
          if (this.wave >= 5 && roll < 0.08) type = 'general';
          this.enemies.push(new Enemy(pos.x, pos.y, type, this.wave));
        }
      }
    }

    if (this.enemies.filter(e => !e.dead).length === 0) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) { this.waveTimer = 4; this.spawnWave(); }
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

  gameOver() {
    if (!this.running) return;
    this.running = false;
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('finalKills').textContent = this.totalKills;
    document.getElementById('finalCombo').textContent = this.player.maxCombo;
    document.getElementById('finalScore').textContent = Math.floor(this.score);
    const m = Math.floor(this.gameTime / 60), s = Math.floor(this.gameTime % 60);
    document.getElementById('finalTime').textContent = `${m}分${s}秒`;
    document.getElementById('finalWave').textContent = this.wave;
    document.getElementById('finalLevel').textContent = this.player.level;
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
      wave: this.wave,
      score: this.score,
      gameTime: this.gameTime,
      totalKills: this.totalKills
    };
  }
}
