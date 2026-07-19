import { isBossType, ENDLESS_CONFIG, ENDLESS_BOSS_POOL } from '../../config/index.js';

export class EndlessPhaseManager {
  constructor(game) {
    this.game = game;
    this.phase = 'endless';
    this.wave = 1;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.spawnInterval = ENDLESS_CONFIG.spawnIntervalStart;
    this.eliteChance = ENDLESS_CONFIG.eliteChanceStart;
    this.bossSpawnedThisWave = false;
  }

  startLevel() {
    this.game.effectManager.showWaveAnnounce(0, '无尽模式 · 第 1 波');
  }

  update(dt) {
    if (!this.game.running) return;

    this.waveTimer += dt;
    this.spawnTimer += dt;

    const minutes = Math.floor(this.game.gameTime / 60);
    this.spawnInterval = Math.max(
      ENDLESS_CONFIG.spawnIntervalMin,
      ENDLESS_CONFIG.spawnIntervalStart - minutes * ENDLESS_CONFIG.spawnIntervalDecayPerMinute
    );
    this.eliteChance = Math.min(
      ENDLESS_CONFIG.eliteChanceMax,
      ENDLESS_CONFIG.eliteChanceStart + minutes * ENDLESS_CONFIG.eliteChanceGrowthPerMinute
    );

    if (this.waveTimer >= ENDLESS_CONFIG.waveDuration) {
      this.wave++;
      this.waveTimer = 0;
      this.bossSpawnedThisWave = false;
      this.game.effectManager.showWaveAnnounce(0, `第 ${this.wave} 波`);
      this.game.effectManager.addKillLog(`第 ${this.wave} 波开始！`);
    }

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this._spawnGroup();
    }

    if (
      !this.bossSpawnedThisWave &&
      this.waveTimer >= ENDLESS_CONFIG.waveDuration / 2 &&
      this.wave % ENDLESS_CONFIG.bossEveryNWaves === 0
    ) {
      this.bossSpawnedThisWave = true;
      this._spawnBoss();
    }
  }

  _spawnGroup() {
    const game = this.game;
    const maxMinions = ENDLESS_CONFIG.maxMinionsBase + this.wave * ENDLESS_CONFIG.maxMinionsPerWave;
    const aliveMinions = game.enemies.filter(e => !e.dead && !isBossType(e.type)).length;
    if (aliveMinions >= maxMinions) return;

    const count = Math.min(ENDLESS_CONFIG.groupCountMax, ENDLESS_CONFIG.groupCountBase + Math.floor(this.wave / ENDLESS_CONFIG.groupCountPerWaves));
    for (let i = 0; i < count; i++) {
      if (game.enemies.filter(e => !e.dead && !isBossType(e.type)).length >= maxMinions) break;
      const pos = this._randomSpawnPos();
      const r = Math.random();
      const type = ENDLESS_CONFIG.spawnTypeWeights.find(w => r < w.threshold).type;
      const enemy = game.spawnManager.createEnemy(type, pos.x, pos.y);
      this._applyEndlessScaling(enemy);
      this._tryMakeElite(enemy);
      game.enemies.push(enemy);
    }
  }

  _spawnBoss() {
    const game = this.game;
    const type = ENDLESS_BOSS_POOL[Math.min(ENDLESS_BOSS_POOL.length - 1, Math.floor((this.wave - 1) / 5))];
    const pos = game.spawnManager.randomBossSpawnPos();
    const boss = game.spawnManager.createEnemy(type, pos.x, pos.y, {
      skipRevive: ENDLESS_CONFIG.boss.skipRevive,
      enhanced: this.wave >= ENDLESS_CONFIG.boss.enhancedAtWave
    });
    this._applyEndlessScaling(boss);
    game.enemies.push(boss);

    const bossName = boss.name || 'Boss';
    game.effectManager.showWaveAnnounce(0, `⚠ ${bossName} 来袭！`);
    game.effectManager.addKillLog(`${bossName} 降临！`);
    game.effectManager.addText(game.player.x, game.player.y - 80, `${bossName} 来袭！`, '#ff44ff', 24, '#000');
    game.effectManager.shakeScreen(6);
  }

  _applyEndlessScaling(enemy) {
    const sc = ENDLESS_CONFIG.scaling;
    const waveMult = sc.waveMultBase + (this.wave - 1) * sc.waveMultPerWave;
    const timeMult = sc.timeMultBase + Math.floor(this.game.gameTime / 60) * sc.timeMultPerMinute;
    const mult = waveMult * timeMult;
    enemy.maxHp = Math.floor(enemy.maxHp * mult);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * mult);
    enemy.def = Math.floor(enemy.def * mult);
    enemy.exp = Math.floor(enemy.exp * mult);
    enemy.score = Math.floor(enemy.score * mult);
  }

  _tryMakeElite(enemy) {
    if (isBossType(enemy.type)) return;
    if (Math.random() >= this.eliteChance) return;
    const cfg = ENDLESS_CONFIG.elite;
    enemy.isElite = true;
    enemy.name = `${cfg.prefix}${enemy.name}`;
    enemy.maxHp = Math.floor(enemy.maxHp * cfg.hpMult);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * cfg.atkMult);
    enemy.exp = Math.floor(enemy.exp * cfg.expMult);
    enemy.score = Math.floor(enemy.score * cfg.scoreMult);
    enemy.dropRate = Math.min(1, enemy.dropRate * cfg.dropRateMult);
    if (enemy.sprite) enemy.sprite.setTint(cfg.tint);
  }

  _randomSpawnPos() {
    return this.game.spawnManager.randomEdgePos(
      ENDLESS_CONFIG.spawnMargin,
      ENDLESS_CONFIG.spawnBand,
      44
    );
  }

  getPhaseName() {
    return `第 ${this.wave} 波`;
  }

  // 兼容 GameController.update 中的调用
  updateRescueWinTimer() {
    return false;
  }
}
