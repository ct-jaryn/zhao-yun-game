import { MAP_W, MAP_H, CHAPTER_CONFIG, HERO_COMBAT_CONFIG, RUN_REWARD_CONFIG } from '../config/index.js';
import { ENEMY_TYPES, BOSS_TYPES, MINION_TYPES, isBossType } from '../config/index.js';
import { rand, pick } from './utils/index.js';
import { Player } from './entities/Player.js';
import { RunConfig } from '../game/RunConfig.js';
import { Projectile } from './entities/Projectile.js';
import { EffectManager } from './managers/EffectManager.js';
import { CollisionManager } from './managers/CollisionManager.js';
import { PhaseManager } from './managers/PhaseManager.js';
import { EndlessPhaseManager } from './managers/EndlessPhaseManager.js';
import { SpawnManager } from './managers/SpawnManager.js';
import { DropManager } from './managers/DropManager.js';
import { UISync } from './UISync.js';
import { MinimapRenderer } from './MinimapRenderer.js';
import { DirectionHints } from './DirectionHints.js';
import { PauseManager } from './systems/PauseManager.js';
import { RewardSystem } from './systems/RewardSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';

export class GameController {
  constructor(scene) {
    this.scene = scene;
    this.chapter = 1;
    this.chapterConfig = CHAPTER_CONFIG[1];
    this.skin = 'classic';
    this.runConfig = null;
    this.onRunCompleteCallback = null;

    this.player = null;
    this.enemies = [];
    this.projectiles = [];

    this.totalKills = 0;
    this.score = 0;
    this.gameTime = 0;
    this.running = true;
    this.pauseManager = new PauseManager(this);
    this.rewardSystem = new RewardSystem(this);
    this.combatSystem = new CombatSystem();
    this.levelUpOpen = false;
    this.pendingRewards = [];
    this.equipPanelOpen = false;

    this.cam = { x: 0, y: 0 };
    this.pauseToggleCd = 0;
    this.equipToggleCd = 0;
  }

  start(runConfig) {
    const scene = this.scene;
    this.shutdown();
    this.scene = scene;

    this.runConfig = runConfig instanceof RunConfig
      ? runConfig
      : new RunConfig({
          heroId: 'zhaoyun',
          skin: 'classic',
          chapter: 1,
          difficulty: 'normal',
          mode: 'story',
          heroData: RunConfig.createDefaultHeroData('zhaoyun')
        });
    const cfg = this.runConfig;

    this.chapter = cfg.chapter;
    this.chapterConfig = CHAPTER_CONFIG[cfg.chapter] || CHAPTER_CONFIG[1];
    this.skin = cfg.skin;
    this.endlessWave = 1;

    this.totalKills = 0;
    this.score = 0;
    this.gameTime = 0;
    this.running = true;
    if (!this.pauseManager) this.pauseManager = new PauseManager(this);
    if (!this.rewardSystem) this.rewardSystem = new RewardSystem(this);
    this.pauseManager.reset();
    this.levelUpOpen = false;
    this.pendingRewards = [];
    this.equipPanelOpen = false;

    const combatStats = cfg.toCombatStats();
    this.player = new Player(this.scene, MAP_W / 2, MAP_H / 2, combatStats);

    this.effectManager = new EffectManager(this);
    this.collisionManager = new CollisionManager(this);
    this.phaseManager = cfg.mode === 'endless'
      ? new EndlessPhaseManager(this)
      : new PhaseManager(this);
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
      if (this.runConfig.mode !== 'endless') {
        this.spawnManager.update(dt);
      }
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
    const isEndless = this.runConfig && this.runConfig.mode === 'endless';

    // 触发英雄击杀被动（典韦回血等）
    if (this.player && this.player.onKill) {
      this.player.onKill(e, this);
    }

    if (isBossType(e.type)) {
      this.totalKills++;
      this.effectManager.checkKillMilestone();
      this.score += e.score;

      // 无尽模式：Boss 只提供奖励，不影响关卡流程
      if (isEndless) {
        this.rewardBossKill(e, false);
        this.effectManager.addKillLog(`${e.name}被击败！`);
        this.effectManager.addText(e.x, e.y - e.radius - 50, `${e.name}被击败！`, '#ff0000', 28, '#000');
        return;
      }

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
    const comboCfg = HERO_COMBAT_CONFIG.combo;
    const comboBonus = 1 + Math.floor(this.player.combo / comboCfg.milestoneEvery) * comboCfg.milestoneBonus;
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

    // 无尽模式不需要故事阶段的清兵计数
    if (!isEndless) {
      if (MINION_TYPES.includes(e.type)) {
        this.phaseManager.soldierKills++;
        if (this.phaseManager.phase === 'soldiers' && this.phaseManager.soldierKills >= this.phaseManager.soldiersRequired) {
          this.phaseManager.spawnBoss();
        }
      }
    }
  }

  rewardBossKill(boss, isFinal = false) {
    this.player.addExp(this.player.expToLevel, this);
    this.effectManager.addText(this.player.x, this.player.y - 90, isFinal ? '通关奖励：等级提升！' : '击败Boss：等级提升！', '#ffd700', 22, '#000');
    const cfg = RUN_REWARD_CONFIG;
    this.dropManager.spawnBossDrops(boss, cfg.bossDropCount, isFinal ? cfg.bossDropQualityBonus : 0);
    this.effectManager.addText(boss.x, boss.y - boss.radius - 55, `掉落 ${cfg.bossDropCount} 件装备！`, '#ffaa44', 18, '#000');
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
    const result = this.combatSystem.calculateSkillHit(this.player, e, skillIdx);
    e.takeDamage(result.damage, result.isCrit, this.player.dir, this);

    if (result.lifestealHeal > 0) {
      this.player.hp = Math.min(this.player.maxHpTotal, this.player.hp + result.lifestealHeal);
      this.effectManager.addText(this.player.x, this.player.y - 60, `+${result.lifestealHeal}`, '#44ff44', 14, '#000');
    }

    this.player.combo++;
    this.player.comboTimer = HERO_COMBAT_CONFIG.combo.resetTime;
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
    this.completeRun(false);
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
    this.completeRun(true);
  }

  completeRun(cleared) {
    if (!this.runConfig) return;

    const diffCfg = this.runConfig.getDifficultyConfig();
    const wave = this.runConfig.mode === 'endless' && this.phaseManager
      ? (this.phaseManager.wave || 1)
      : 0;
    const result = {
      heroId: this.runConfig.heroId,
      skin: this.runConfig.skin,
      mode: this.runConfig.mode,
      chapter: this.runConfig.chapter,
      difficulty: this.runConfig.difficulty,
      cleared,
      kills: this.totalKills,
      score: Math.floor(this.score * diffCfg.scoreMult),
      time: this.gameTime,
      maxCombo: this.player ? this.player.maxCombo : 0,
      runLevel: this.player ? this.player.level : 1,
      wave,
      expGained: Math.floor((this.totalKills * RUN_REWARD_CONFIG.scoreMultPerKill + this.score * RUN_REWARD_CONFIG.scoreMultPerScore) * diffCfg.expMult),
      coinsGained: Math.floor((this.totalKills * RUN_REWARD_CONFIG.coinMultPerKill + this.score * RUN_REWARD_CONFIG.coinMultPerScore) * diffCfg.coinMult),
      soulsGained: Math.floor(cleared ? RUN_REWARD_CONFIG.soulsOnClear * diffCfg.coinMult : RUN_REWARD_CONFIG.soulsOnFail),
      drops: this._collectRunDrops(),
      milestones: []
    };

    if (typeof this.onRunCompleteCallback === 'function') {
      this.onRunCompleteCallback(result);
    }
  }

  _collectRunDrops() {
    // 从玩家当前装备中收集非初始装备作为掉落奖励
    // 实际运行中掉落应记录在 DropManager；这里简化为玩家当前装备
    const drops = [];
    if (!this.player) return drops;
    const initialNames = RUN_REWARD_CONFIG.initialEquipNames;
    for (const eq of Object.values(this.player.equip)) {
      if (eq && !initialNames.includes(eq.name)) {
        drops.push(eq);
      }
    }
    return drops;
  }

  setOnRunCompleteCallback(cb) {
    this.onRunCompleteCallback = cb;
  }

  getPhaseName() {
    return this.phaseManager ? this.phaseManager.getPhaseName() : '清兵阶段';
  }

  get paused() {
    return this.pauseManager ? this.pauseManager.isPaused() : false;
  }

  // ===== 暂停与面板 =====

  addPause(reason) {
    this.pauseManager.addPause(reason);
  }

  removePause(reason) {
    this.pauseManager.removePause(reason);
  }

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
    if (!this.scene) return;

    this.running = false;
    this.cleanupEntities();

    const managers = [
      this.effectManager,
      this.collisionManager,
      this.phaseManager,
      this.spawnManager,
      this.dropManager,
      this.uiSync,
      this.minimap,
      this.rewardSystem,
      this.pauseManager,
      this.directionHints
    ];

    for (const mgr of managers) {
      if (mgr && typeof mgr.shutdown === 'function') {
        try {
          mgr.shutdown();
        } catch (err) {
          console.warn('[GameController] 子系统清理失败:', err);
        }
      }
    }

    this.effectManager = null;
    this.collisionManager = null;
    this.phaseManager = null;
    this.spawnManager = null;
    this.dropManager = null;
    this.uiSync = null;
    this.minimap = null;
    this.rewardSystem = null;
    this.pauseManager = null;
    this.directionHints = null;
    this.onRunCompleteCallback = null;
    this.runConfig = null;
    this.scene = null;
  }
}
