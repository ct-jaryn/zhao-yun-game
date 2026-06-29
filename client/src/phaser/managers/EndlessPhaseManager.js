import { MAP_W, MAP_H } from '../utils/index.js';
import { rand, randInt } from '../utils/index.js';

const ENDLESS_CONFIG = {
  waveDuration: 45,
  spawnIntervalStart: 1.5,
  spawnIntervalMin: 0.35,
  eliteChanceStart: 0.08,
  eliteChanceMax: 0.55,
  bossEveryNWaves: 5,
  maxMinionsBase: 30,
  maxMinionsPerWave: 2
};

const BOSS_TYPES = ['boss', 'lubu', 'dianwei', 'xuzhu'];

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
      ENDLESS_CONFIG.spawnIntervalStart - minutes * 0.08
    );
    this.eliteChance = Math.min(
      ENDLESS_CONFIG.eliteChanceMax,
      ENDLESS_CONFIG.eliteChanceStart + minutes * 0.04
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
    const aliveMinions = game.enemies.filter(e => !e.dead && !BOSS_TYPES.includes(e.type)).length;
    if (aliveMinions >= maxMinions) return;

    const count = Math.min(5, 2 + Math.floor(this.wave / 3));
    for (let i = 0; i < count; i++) {
      if (game.enemies.filter(e => !e.dead && !BOSS_TYPES.includes(e.type)).length >= maxMinions) break;
      const pos = this._randomSpawnPos();
      const r = Math.random();
      const type = r < 0.35 ? 'soldier' : (r < 0.70 ? 'archer' : 'cavalry');
      const enemy = game.spawnManager.createEnemy(type, pos.x, pos.y);
      this._applyEndlessScaling(enemy);
      this._tryMakeElite(enemy);
      game.enemies.push(enemy);
    }
  }

  _spawnBoss() {
    const game = this.game;
    const bossPool = ['boss', 'dianwei', 'xuzhu', 'lubu'];
    const type = bossPool[Math.min(bossPool.length - 1, Math.floor((this.wave - 1) / 5))];
    const pos = game.spawnManager.randomBossSpawnPos();
    const boss = game.spawnManager.createEnemy(type, pos.x, pos.y, {
      skipRevive: true,
      enhanced: this.wave >= 10
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
    const waveMult = 1 + (this.wave - 1) * 0.12;
    const timeMult = 1 + Math.floor(this.game.gameTime / 60) * 0.08;
    const mult = waveMult * timeMult;
    enemy.maxHp = Math.floor(enemy.maxHp * mult);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * mult);
    enemy.def = Math.floor(enemy.def * mult);
    enemy.exp = Math.floor(enemy.exp * mult);
    enemy.score = Math.floor(enemy.score * mult);
  }

  _tryMakeElite(enemy) {
    if (BOSS_TYPES.includes(enemy.type)) return;
    if (Math.random() >= this.eliteChance) return;
    enemy.isElite = true;
    enemy.name = `精英·${enemy.name}`;
    enemy.maxHp = Math.floor(enemy.maxHp * 1.5);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * 1.3);
    enemy.exp = Math.floor(enemy.exp * 1.5);
    enemy.score = Math.floor(enemy.score * 1.5);
    enemy.dropRate = Math.min(1, enemy.dropRate * 1.5);
    if (enemy.sprite) enemy.sprite.setTint(0xffaa00);
  }

  _randomSpawnPos() {
    const side = randInt(0, 3);
    const margin = 150;
    switch (side) {
      case 0: return { x: rand(margin, MAP_W - margin), y: rand(margin, margin + 200) };
      case 1: return { x: rand(margin, MAP_W - margin), y: rand(MAP_H - margin - 200, MAP_H - margin) };
      case 2: return { x: rand(margin, margin + 200), y: rand(margin, MAP_H - margin) };
      default: return { x: rand(MAP_W - margin - 200, MAP_W - margin), y: rand(margin, MAP_H - margin) };
    }
  }

  getPhaseName() {
    return `第 ${this.wave} 波`;
  }

  // 兼容 GameController.update 中的调用
  updateRescueWinTimer() {
    return false;
  }
}
