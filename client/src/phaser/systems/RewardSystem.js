import { REWARD_TYPES, EQUIP_TYPES, QUALITY, ZHAO_YUN_EQUIP_TIERS } from '../../config/index.js';
import { randInt, pick } from '../utils/index.js';

export class RewardSystem {
  constructor(game) {
    this.game = game;
  }

  getMissingGodEquipTypes() {
    return EQUIP_TYPES.filter(type => {
      const eq = this.game.player.equip[type];
      return !eq || eq.quality.name !== '传说';
    });
  }

  genGodEquip(type) {
    const level = this.game.player.level;
    const tier = Math.min(4, Math.max(2, 1 + Math.floor(level / 5)));
    const tierData = ZHAO_YUN_EQUIP_TIERS[tier][type];
    const q = QUALITY[4];
    const stats = {};
    for (const [k, v] of Object.entries(tierData.stats)) {
      stats[k] = Math.floor(v * q.mult * (0.9 + Math.random() * 0.2));
    }
    return { type, name: tierData.name, quality: q, stats, level, tier };
  }

  grantGodEquip() {
    const missing = this.getMissingGodEquipTypes();
    if (missing.length === 0) return null;
    const type = pick(missing);
    const eq = this.genGodEquip(type);
    this.game.player.equip[type] = eq;
    return eq;
  }

  applyReward(r) {
    const { game } = this;
    if (r.id === 'godEquip') {
      const eq = this.grantGodEquip();
      if (eq) {
        game.effectManager.addText(game.player.x, game.player.y - 60, `获得 ${eq.name}`, eq.quality.color, 18, '#000');
      }
    } else {
      r.apply(game.player);
      game.effectManager.addText(game.player.x, game.player.y - 60, r.name, '#ffd700', 18, '#000');
    }
  }

  buildRewardPool() {
    return REWARD_TYPES.filter(r => {
      if (r.id === 'godEquip') {
        return this.game.player.level >= 10 && this.getMissingGodEquipTypes().length > 0;
      }
      return true;
    });
  }

  pickRewards(count = 3) {
    const pool = this.buildRewardPool();
    const rewards = [];
    while (rewards.length < count && pool.length > 0) {
      const idx = randInt(0, pool.length - 1);
      rewards.push(pool.splice(idx, 1)[0]);
    }
    return rewards;
  }

  showLevelUp() {
    const { game } = this;
    game.pauseManager.addPause('levelup');
    game.levelUpOpen = true;

    const rewards = this.pickRewards(3);
    game.pendingRewards = rewards;

    if (game.uiSync && game.uiSync.showLevelUp) {
      game.uiSync.showLevelUp(rewards, (r) => {
        this.applyReward(r);
        game.levelUpOpen = false;
        game.pauseManager.removePause('levelup');
      });
    } else {
      // 无 UI 时自动选择第一个
      if (rewards[0]) this.applyReward(rewards[0]);
      game.levelUpOpen = false;
      game.pauseManager.removePause('levelup');
    }
  }
}
