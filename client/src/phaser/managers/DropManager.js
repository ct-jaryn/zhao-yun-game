import { genEquip, equipPower } from '../systems/EquipmentFactory.js';
import { DropItem } from '../entities/DropItem.js';
import { vdist, vec } from '../utils/index.js';

export class DropManager {
  constructor(game) {
    this.game = game;
    this.drops = [];
    this.nearestDrop = null;
  }

  shouldEquip(eq, old) {
    return equipPower(eq) > equipPower(old);
  }

  getDifficultyDropBonus() {
    const runConfig = this.game.runConfig;
    if (!runConfig) return 0;
    const diff = runConfig.getDifficultyConfig();
    const challenge = runConfig.challenge || {};
    return (diff.dropBonus || 0) + (challenge.dropBonus || 0);
  }

  getBossDropCountBonus() {
    const runConfig = this.game.runConfig;
    if (!runConfig) return 0;
    const diff = runConfig.getDifficultyConfig();
    const challenge = runConfig.challenge || {};
    return (diff.bossDropCountBonus || 0) + (challenge.bossDropCountBonus || 0);
  }

  spawnDrop(x, y, level, bonus = 0) {
    const effectiveLevel = Math.max(1, level + bonus + this.getDifficultyDropBonus());
    const eq = genEquip(effectiveLevel);
    const item = new DropItem(this.game.scene, x, y, eq);
    this.drops.push(item);
    return eq;
  }

  spawnBossDrops(boss, count, levelBonus = 0) {
    const eqs = [];
    const totalCount = count + this.getBossDropCountBonus();
    for (let i = 0; i < totalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 60;
      const eq = this.spawnDrop(boss.x + Math.cos(angle) * dist, boss.y + Math.sin(angle) * dist, this.game.player.level, levelBonus);
      eqs.push(eq);
    }
    return eqs;
  }

  checkNearestDrop() {
    const p = this.game.player;
    let nearest = null, nearDist = 120;
    for (const d of this.drops) {
      if (d.life <= 0) continue;
      const dist = vdist(vec(p.x, p.y), vec(d.x, d.y));
      if (dist < nearDist) { nearest = d; nearDist = dist; }
    }
    this.nearestDrop = nearest;
  }

  autoPickupDrops() {
    const p = this.game.player;
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

  pickupDrop(drop = null) {
    const d = drop || this.nearestDrop;
    if (!d) return;
    const game = this.game;
    const eq = d.equip;
    const slot = eq.type;
    const old = game.player.equip[slot];

    const equipped = !old || equipPower(eq) > equipPower(old);

    if (equipped) {
      game.player.equip[slot] = eq;
      game.effectManager.addText(game.player.x, game.player.y - 50, `装备 ${eq.name}`, eq.quality.color, 16, '#000');
      if (slot === '铠甲' || slot === '头盔' || slot === '饰品') {
        game.player.hp = Math.min(game.player.hp + 20, game.player.maxHpTotal);
      }
      if (eq.tier === 4) {
        game.effectManager.addText(game.player.x, game.player.y - 90, `✨ 获得最终装备：${eq.name}！`, '#ffd700', 26, '#000');
        game.effectManager.addKillLog(`获得最终装备：${eq.name}`);
        game.effectManager.shakeScreen(4);
        game.effectManager.flashScreen('#ffd700', 0.3);
        game.effectManager.addParticles(game.player.x, game.player.y, '#ffd700', 20, 120);
      }
    } else {
      game.effectManager.addText(game.player.x, game.player.y - 50, `${eq.name} 不如当前装备`, '#888', 12, null);
    }

    const idx = this.drops.indexOf(d);
    if (idx >= 0) {
      this.drops[idx].destroy();
      this.drops.splice(idx, 1);
    }
    if (!drop) this.nearestDrop = null;
  }

  update(dt) {
    this.drops = this.drops.filter(d => {
      const alive = d.update(dt);
      if (!alive) d.destroy();
      return alive;
    });
    this.autoPickupDrops();
    this.checkNearestDrop();
  }
}
