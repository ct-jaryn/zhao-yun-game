import { MAP_W, MAP_H } from './utils/index.js';
import { ENEMY_TYPES, SKILLS } from '../config/index.js';
import { rand, pick } from './utils/index.js';
import { Player } from './entities/Player.js';
import { Projectile } from './entities/Projectile.js';
import { EffectManager } from './managers/EffectManager.js';
import { CollisionManager } from './managers/CollisionManager.js';
import { PhaseManager } from './managers/PhaseManager.js';
import { SpawnManager } from './managers/SpawnManager.js';
import { DropManager } from './managers/DropManager.js';
import { UISync } from './UISync.js';
import { MinimapRenderer } from './MinimapRenderer.js';
import { DirectionHints } from './DirectionHints.js';
import { PauseManager } from './systems/PauseManager.js';
import { RewardSystem } from './systems/RewardSystem.js';

const CHAPTER_CONFIG = {
  1: {
    name: '虎牢救美', subtitle: '单骑救貂蝉', enemyLevelBonus: 0, maxMinions: 25,
    tint: null, bossType: 'lubu', bossName: '吕布',
    finalBosses: [{ type: 'lubu', enhanced: true, name: '吕布·狂暴' }],
    victoryText: '通关！吕布败退，貂蝉得救！', victorySubtitle: '貂蝉已被安全救出'
  },
  2: {
    name: '血战宛城', subtitle: '古之恶来', enemyLevelBonus: 1, maxMinions: 30,
    tint: null, bossType: 'dianwei', bossName: '典韦',
    finalBosses: [{ type: 'boss', enhanced: true, name: '曹操·狂暴' }, { type: 'dianwei', name: '典韦' }],
    victoryText: '通关！典韦与曹操皆已被击败！', victorySubtitle: '古之恶来陨落，铁戟染血，宛城之路已开！'
  },
  3: {
    name: '渭水怒涛', subtitle: '虎痴之锤', enemyLevelBonus: 2, maxMinions: 32,
    tint: 'rgba(20,20,40,0.25)', bossType: 'xuzhu', bossName: '许褚',
    finalBosses: [{ type: 'boss', enhanced: true, name: '曹操·狂暴' }, { type: 'xuzhu', name: '许褚' }],
    victoryText: '通关！许褚与曹操皆已被击败！', victorySubtitle: '虎痴倒下，巨锤沉江，渭水为之呜咽！'
  },
  4: {
    name: '下邳焚天', subtitle: '无双吕布', enemyLevelBonus: 3, maxMinions: 35,
    tint: 'rgba(60,15,10,0.28)', bossType: 'lubu', bossName: '吕布',
    finalBosses: [{ type: 'boss', enhanced: true, name: '曹操·狂暴' }, { type: 'lubu', name: '吕布' }],
    victoryText: '通关！吕布与曹操皆已被击败！', victorySubtitle: '无双吕布败退，方天画戟折锋，天下谁还敢挡！'
  }
};

export class GameController {
  constructor(scene) {
    this.scene = scene;
    this.chapter = 1;
    this.chapterConfig = CHAPTER_CONFIG[1];
    this.skin = 'classic';

    this.player = null;
    this.enemies = [];
    this.projectiles = [];

    this.totalKills = 0;
    this.score = 0;
    this.gameTime = 0;
    this.running = true;
    this.pauseManager = new PauseManager(this);
    this.rewardSystem = new RewardSystem(this);
    this.levelUpOpen = false;
    this.pendingRewards = [];
    this.equipPanelOpen = false;

    this.cam = { x: 0, y: 0 };
    this.pauseToggleCd = 0;
    this.equipToggleCd = 0;
  }

  start(chapter, skin) {
    this.shutdown();

    this.chapter = chapter;
    this.chapterConfig = CHAPTER_CONFIG[chapter] || CHAPTER_CONFIG[1];
    this.skin = skin;

    this.totalKills = 0;
    this.score = 0;
    this.gameTime = 0;
    this.running = true;
    this.pauseManager.reset();
    this.levelUpOpen = false;
    this.pendingRewards = [];
    this.equipPanelOpen = false;

    this.player = new Player(this.scene, MAP_W / 2, MAP_H / 2, skin);

    this.effectManager = new EffectManager(this);
    this.collisionManager = new CollisionManager(this);
    this.phaseManager = new PhaseManager(this);
    this.spawnManager = new SpawnManager(this);
    this.dropManager = new DropManager(this);
    this.uiSync = new UISync(this);
    this.minimap = new MinimapRenderer(this);
    this.directionHints = new DirectionHints(this.scene);

    this.setupCamera();
    this.phaseManager.startLevel();
  }

  cleanupEntities() {
    if (this.player) { this.player.destroy(); this.player = null; }
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    if (this.dropManager) {
      this.dropManager.drops.forEach(d => d.destroy());
      this.dropManager.drops = [];
      this.dropManager.nearestDrop = null;
    }
  }

  setupCamera() {
    const camera = this.scene.cameras.main;
    camera.setBounds(0, 0, MAP_W, MAP_H);
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);
    camera.setZoom(1);
  }

  update(dt, input) {
    if (!this.running) return;

    if (this.levelUpOpen) return;

    if (this.phaseManager.updateRescueWinTimer(dt)) return;

    if (this.pauseToggleCd > 0) this.pauseToggleCd -= dt;
    if (this.equipToggleCd > 0) this.equipToggleCd -= dt;

    // Esc 始终响应：对话期间关闭对话，否则切换暂停
    // （升级面板打开时 levelUpOpen 已在上方 return，不会走到这里）
    if (input.isDown('Escape') && this.pauseToggleCd <= 0) {
      this.pauseToggleCd = 0.15;
      if (this.pauseManager.hasReason('dialogue')) {
        if (this.uiSync && this.uiSync.hideDialogue) this.uiSync.hideDialogue();
      } else {
        this.togglePause();
      }
    }

    if (!this.pauseManager.isPaused()) {
      this.gameTime += dt;
      this.player.update(dt, input, this);

      if (input.justDown('KeyE')) {
        this.dropManager.pickupDrop();
      }
      if (input.isDown('Tab') && this.equipToggleCd <= 0) {
        this.equipToggleCd = 0.15;
        this.toggleEquipPanel();
      }

      if (this.player.dead) {
        this.gameOver();
        return;
      }

      this.phaseManager.update(dt);

      for (const e of this.enemies) e.update(dt, this);

      this.projectiles = this.projectiles.filter(p => p.update(dt));
      this.effectManager.update(dt);
      this.collisionManager.update(dt);
      this.spawnManager.update(dt);
      this.dropManager.update(dt);

      this.enemies = this.enemies.filter(e => {
        if (e.dead && e.deathTimer <= 0 && !(e.type === 'boss' && e.reviveTimer > 0)) {
          e.destroy();
          return false;
        }
        return true;
      });
    }

    this.uiSync.update(dt);
    this.minimap.update();
    this.directionHints.update(this.enemies);

    this.cam.x = this.scene.cameras.main.scrollX;
    this.cam.y = this.scene.cameras.main.scrollY;
  }

  // ===== 击杀与阶段 =====

  onEnemyKilled(e) {
    const cfg = this.chapterConfig;
    const BOSS_TYPES = ['boss', 'lubu', 'dianwei', 'xuzhu'];

    if (BOSS_TYPES.includes(e.type)) {
      this.totalKills++;
      this.effectManager.checkKillMilestone();
      this.score += e.score;

      if (this.phaseManager.phase === 'caocao' && e.type === cfg.bossType) {
        this.phaseManager.midBossDefeated = true;
        this.rewardBossKill(e, false);

        if (this.chapter === 1 && this.phaseManager.diaochan) {
          this.effectManager.addKillLog(`${cfg.bossName}败退！貂蝉获救！`);
          this.effectManager.addText(e.x, e.y - e.radius - 50, `${cfg.bossName}败退！貂蝉获救！`, '#ff0000', 28, '#000');
          this.effectManager.shakeScreen(10);
          this.effectManager.flashScreen('#ff0000', 0.6);
          this.phaseManager.rescueDiaoChan();
          return;
        }

        const finalNames = cfg.finalBosses.map(b => b.name).join('、');
        this.effectManager.addKillLog(`${cfg.bossName}败退！${finalNames}同时降临！`);
        this.effectManager.addText(e.x, e.y - e.radius - 50, `${cfg.bossName}败退！${finalNames}同时降临！`, '#ff0000', 28, '#000');
        this.effectManager.shakeScreen(10);
        this.effectManager.flashScreen('#ff0000', 0.6);
        this.phaseManager.spawnFinalBosses();
        return;
      }

      if (this.phaseManager.phase === 'final') {
        const idx = cfg.finalBosses.findIndex(b => b.type === e.type && (!b.enhanced || e.enhanced));
        if (idx === 0) this.phaseManager.finalBoss1Defeated = true;
        else if (idx === 1) this.phaseManager.finalBoss2Defeated = true;
        if (idx >= 0) {
          this.rewardBossKill(e, false);
          this.effectManager.addKillLog(`${e.name}被击败！`);
          this.effectManager.addText(e.x, e.y - e.radius - 50, `${e.name}被击败！`, '#ff0000', 28, '#000');
          this.phaseManager.checkFinalVictory();
          return;
        }
      }
      return;
    }

    this.totalKills++;
    this.effectManager.checkKillMilestone();
    const comboBonus = 1 + Math.floor(this.player.combo / 5) * 0.2;
    this.score += Math.floor(e.score * comboBonus);
    this.player.addExp(e.exp, this);
    this.effectManager.addKillLog(`击杀 Lv.${e.level} ${e.name} +${e.score}分`);
    this.effectManager.addParticles(e.x, e.y, '#ff4444', 15, 110);

    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      this.effectManager.addParticles(e.x, e.y, pick(['#ff6644','#ffaa44','#ff4422']), 1, 80, rand(3, 7));
    }

    if (Math.random() < e.dropRate) {
      this.dropManager.spawnDrop(e.x, e.y, Math.max(1, this.player.level));
    }

    const MINION_TYPES = ['soldier', 'archer', 'cavalry'];
    if (MINION_TYPES.includes(e.type)) {
      this.phaseManager.soldierKills++;
      if (this.phaseManager.phase === 'soldiers' && this.phaseManager.soldierKills >= this.phaseManager.soldiersRequired) {
        this.phaseManager.spawnBoss();
      }
    }
  }

  rewardBossKill(boss, isFinal = false) {
    this.player.addExp(this.player.expToLevel, this);
    this.effectManager.addText(this.player.x, this.player.y - 90, isFinal ? '通关奖励：等级提升！' : '击败Boss：等级提升！', '#ffd700', 22, '#000');
    this.dropManager.spawnBossDrops(boss, 1, isFinal ? 2 : 0);
    this.effectManager.addText(boss.x, boss.y - boss.radius - 55, `掉落 1 件装备！`, '#ffaa44', 18, '#000');
  }

  onBossFirstDeath(boss) {
    this.rewardBossKill(boss, false);
    this.effectManager.addText(boss.x, boss.y - boss.radius - 40, `${boss.name}倒下，60秒后复活！`, '#ff44ff', 24, '#000');
    this.effectManager.addKillLog(`${boss.name}倒下，正在积蓄力量…`);
    this.effectManager.shakeScreen(8);
    this.effectManager.flashScreen('#960096', 0.4);
    this.effectManager.addParticles(boss.x, boss.y, '#ff44ff', 40, 160);
  }

  onBossRevived(boss) {
    this.effectManager.addText(boss.x, boss.y - boss.radius - 40, `${boss.name}复活！力量翻倍！`, '#ff2222', 26, '#000');
    this.effectManager.addKillLog(`${boss.name}复活，变得更加强大！`);
    this.effectManager.shakeScreen(10);
    this.effectManager.flashScreen('#ff0000', 0.5);
    this.effectManager.addParticles(boss.x, boss.y, '#ff0000', 50, 200);
  }

  // ===== 玩家技能命中 =====

  hitEnemyWithSkill(e, skillIdx) {
    const sk = SKILLS[skillIdx];
    let dmg = Math.floor(this.player.atk * sk.dmgMult);
    const isCrit = Math.random() * 100 < this.player.crit;
    if (isCrit) dmg = Math.floor(dmg * 1.8);
    e.takeDamage(dmg, isCrit, this.player.dir, this);
    this.player.combo++;
    this.player.comboTimer = 3;
    if (this.player.combo > this.player.maxCombo) this.player.maxCombo = this.player.combo;
  }

  // ===== 升级奖励 =====

  showLevelUp() {
    this.rewardSystem.showLevelUp();
  }

  // ===== 游戏结束 / 胜利 =====

  gameOver() {
    if (!this.running) return;
    this.running = false;
    const screen = document.getElementById('gameOverScreen');
    if (screen) {
      screen.style.display = 'flex';
      document.getElementById('victoryScreen').style.display = 'none';
      document.getElementById('levelUpPanel').style.display = 'none';
      document.getElementById('finalKills').textContent = this.totalKills;
      document.getElementById('finalCombo').textContent = this.player.maxCombo;
      document.getElementById('finalScore').textContent = Math.floor(this.score);
      const m = Math.floor(this.gameTime / 60), s = Math.floor(this.gameTime % 60);
      document.getElementById('finalTime').textContent = `${m}分${s}秒`;
      document.getElementById('finalWave').textContent = this.getPhaseName();
      document.getElementById('finalLevel').textContent = this.player.level;
    }
  }

  gameWin() {
    if (!this.running) return;
    const cfg = this.chapterConfig;
    this.phaseManager.phase = 'victory';
    this.running = false;
    const screen = document.getElementById('victoryScreen');
    if (screen) {
      screen.style.display = 'flex';
      document.getElementById('gameOverScreen').style.display = 'none';
      document.getElementById('levelUpPanel').style.display = 'none';
      document.getElementById('winKills').textContent = this.totalKills;
      document.getElementById('winCombo').textContent = this.player.maxCombo;
      document.getElementById('winScore').textContent = Math.floor(this.score);
      const m = Math.floor(this.gameTime / 60), s = Math.floor(this.gameTime % 60);
      document.getElementById('winTime').textContent = `${m}分${s}秒`;
      document.getElementById('winWave').textContent = this.getPhaseName();
      document.getElementById('winLevel').textContent = this.player.level;
      document.getElementById('winSubtitle').textContent = cfg.victorySubtitle;
    }
    this.effectManager.addText(this.player.x, this.player.y - 80, cfg.victoryText, '#ffd700', 32, '#000');
    this.effectManager.shakeScreen(12);
    this.effectManager.flashScreen('#ffd700', 0.8);
  }

  getPhaseName() {
    return this.phaseManager ? this.phaseManager.getPhaseName() : '清兵阶段';
  }

  // ===== 暂停与面板 =====

  togglePause() {
    if (this.levelUpOpen || !this.running) return;
    if (this.pauseManager.hasReason('pause')) {
      this.pauseManager.removePause('pause');
    } else {
      this.pauseManager.addPause('pause');
    }
    const overlay = document.getElementById('pauseOverlay');
    if (overlay) overlay.style.display = this.pauseManager.isPaused() ? 'flex' : 'none';
    if (!this.pauseManager.isPaused() && this.equipPanelOpen) {
      this.equipPanelOpen = false;
      const panel = document.getElementById('equipPanel');
      if (panel) panel.style.display = 'none';
    }
    if (this.pauseManager.isPaused() && this.uiSync && this.uiSync.updatePause) {
      this.uiSync.updatePause(this.player);
    }
  }

  toggleEquipPanel() {
    if (!this.running || this.levelUpOpen) return;
    this.equipPanelOpen = !this.equipPanelOpen;
    const panel = document.getElementById('equipPanel');
    if (panel) {
      panel.style.display = this.equipPanelOpen ? 'block' : 'none';
      if (this.equipPanelOpen && this.uiSync && this.uiSync.updateEquipPanel) {
        this.uiSync.updateEquipPanel(this.player);
      }
    }
  }

  // ===== 工具方法 =====

  addProjectile(x, y, dir, speed, dmg, owner, color, size, life, imgKey, pierce) {
    this.projectiles.push(new Projectile(this.scene, x, y, dir, speed, dmg, owner, color, size, life, imgKey, pierce));
  }

  shakeScreen(intensity) { this.effectManager.shakeScreen(intensity); }
  flashScreen(color, duration) { this.effectManager.flashScreen(color, duration); }
  addParticles(x, y, color, count, speed, size) { this.effectManager.addParticles(x, y, color, count, speed, size); }
  addText(x, y, text, color, size, outline) { this.effectManager.addText(x, y, text, color, size, outline); }
  addKillLog(text) { this.effectManager.addKillLog(text); }
  showWaveAnnounce(num, sub) { this.effectManager.showWaveAnnounce(num, sub); }

  shutdown() {
    this.cleanupEntities();
    if (this.effectManager) {
      this.effectManager.shutdown();
    }
    if (this.phaseManager && this.phaseManager.diaochan) {
      this.phaseManager.diaochan.destroy();
    }
    if (this.directionHints) {
      if (this.directionHints.graphics) this.directionHints.graphics.destroy();
      if (this.directionHints.arrows) this.directionHints.arrows.forEach(a => a.destroy());
    }
  }
}
