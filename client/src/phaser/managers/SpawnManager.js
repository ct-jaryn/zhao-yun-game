import { MAP_W, MAP_H, isTerrainPositionClear } from '../utils/index.js';
import { rand, randInt } from '../utils/index.js';
import { Enemy } from '../entities/Enemy.js';
import { BOSS_TYPES, isBossType } from '../../config/index.js';

export class SpawnManager {
  constructor(game) {
    this.game = game;
    this.autoSpawnTimer = 0;
    this.autoSpawnInterval = 1.2;
  }

  getEnemyLevel(type) {
    const cfg = this.game.chapterConfig;
    if (type === 'lubu') return 5 + cfg.enemyLevelBonus;
    if (type === 'dianwei' || type === 'xuzhu') return 4 + cfg.enemyLevelBonus;
    if (type === 'boss') return 3 + cfg.enemyLevelBonus;
    const minutes = Math.floor(this.game.gameTime / 60);
    const maxLevel = type === 'cavalry' ? 5 : 3;
    return Math.min(maxLevel, 1 + minutes) + cfg.enemyLevelBonus;
  }

  createEnemy(type, x, y, options = {}) {
    const enemy = new Enemy(this.game.scene, x, y, type, this.getEnemyLevel(type), options);
    this._applyDifficultyScaling(enemy, options);
    return enemy;
  }

  _applyDifficultyScaling(enemy, options = {}) {
    const runConfig = this.game.runConfig;
    if (!runConfig) return;
    const diff = runConfig.getDifficultyConfig();
    const challenge = runConfig.challenge || {};

    enemy.maxHp = Math.floor(enemy.maxHp * diff.enemyHp * (challenge.enemyHpMult || 1));
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * diff.enemyAtk * (challenge.enemyAtkMult || 1));
    enemy.def = Math.floor(enemy.def * diff.enemyDef * (challenge.enemyDefMult || 1));
    enemy.speed = Math.floor(enemy.speed * diff.enemySpeed * (challenge.enemySpeedMult || 1));

    // 精英怪词缀（仅非 Boss）
    if (!isBossType(enemy.type) && !options.elite && !enemy.enhanced && Math.random() < diff.eliteChance) {
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
  }

  randomSpawnPos() {
    return this.randomEdgePos(220, 260, 44);
  }

  randomBossSpawnPos() {
    return this.randomEdgePos(240, 320, 76, 650);
  }

  randomEdgePos(margin = 220, band = 260, radius = 44, minPlayerDistance = 0) {
    const player = this.game.player;

    for (let attempt = 0; attempt < 16; attempt++) {
      const side = randInt(0, 3);
      let pos;
      switch (side) {
        case 0: pos = { x: rand(margin, MAP_W - margin), y: rand(margin, margin + band) }; break;
        case 1: pos = { x: rand(margin, MAP_W - margin), y: rand(MAP_H - margin - band, MAP_H - margin) }; break;
        case 2: pos = { x: rand(margin, margin + band), y: rand(margin, MAP_H - margin) }; break;
        default: pos = { x: rand(MAP_W - margin - band, MAP_W - margin), y: rand(margin, MAP_H - margin) }; break;
      }

      const farEnough = !player || Math.hypot(pos.x - player.x, pos.y - player.y) >= minPlayerDistance;
      if (farEnough && isTerrainPositionClear(pos.x, pos.y, radius, 18)) return pos;
    }

    return { x: MAP_W / 2, y: MAP_H - margin };
  }

  spawnPhaseMinions() {
    const game = this.game;
    const phase = game.phaseManager.phase;
    const isSoldiers = phase === 'soldiers';
    const isCaocao = phase === 'caocao';
    const isFinal = phase === 'final';
    if (!isSoldiers && !isCaocao && !isFinal) return;

    const maxMinions = game.chapterConfig.maxMinions;
    const aliveMinions = game.enemies.filter(e => !e.dead && !BOSS_TYPES.includes(e.type)).length;
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
    game.enemies.push(this.createEnemy(type, pos.x, pos.y));
  }

  update(dt) {
    const challenge = this.game.runConfig && this.game.runConfig.challenge;
    const spawnRateMult = challenge && challenge.spawnRateMult ? challenge.spawnRateMult : 1;
    this.autoSpawnTimer -= dt;
    if (this.autoSpawnTimer <= 0) {
      this.autoSpawnTimer = this.autoSpawnInterval * spawnRateMult;
      this.spawnPhaseMinions();
    }
  }
}
