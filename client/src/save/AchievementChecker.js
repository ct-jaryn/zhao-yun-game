import { ACHIEVEMENTS } from '../config/index.js';

export class AchievementChecker {
  constructor(saveManager) {
    this.save = saveManager;
  }

  /**
   * 检查所有成就，返回本次新解锁的成就列表
   * @param {object} result - 可选，本次战斗结果
   */
  checkAll(result = null) {
    const unlocked = [];
    if (!this.save || !this.save.progression || !this.save.account) return unlocked;
    for (const ach of ACHIEVEMENTS) {
      if (this.save.progression.hasAchievement(ach.id)) continue;
      if (this._checkCondition(ach.condition, result)) {
        this.save.progression.grantAchievement(ach.id);
        this._grantReward(ach.reward);
        unlocked.push(ach);
      }
    }
    return unlocked;
  }

  /**
   * 单独检查某个成就（用于不确定是否已解锁的场景）
   */
  check(id, result = null) {
    if (this.save.progression.hasAchievement(id)) return null;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return null;
    if (this._checkCondition(ach.condition, result)) {
      this.save.progression.grantAchievement(ach.id);
      this._grantReward(ach.reward);
      return ach;
    }
    return null;
  }

  _checkCondition(condition, result) {
    const safe = (val) => val || 0;
    switch (condition.type) {
      case 'totalKills':
        return this._getTotalKills() >= condition.value;
      case 'bestCombo':
        return this._getBestCombo() >= condition.value;
      case 'chapterClear':
        return (this.save.progression._data.clears || []).some(c => c.chapter === condition.value);
      case 'endlessWave':
        return safe(this.save.progression._data.endless.bestWave) >= condition.value;
      case 'currency':
        return this.save.account.getCurrency(condition.currency) >= condition.value;
      case 'rank':
        return safe(this.save.account.rank) >= condition.value;
      case 'unlockedHeroes':
        return (this.save.account.unlockedHeroes || []).length >= condition.value;
      case 'unlockedSkins':
        return this._getTotalUnlockedSkins() >= condition.value;
      case 'totalClears':
        return (this.save.progression._data.clears || []).length >= condition.value;
      default:
        return false;
    }
  }

  _getTotalKills() {
    let total = 0;
    for (const id of this.save.heroes.getHeroIds()) {
      total += this.save.heroes.getHero(id).records.totalKills || 0;
    }
    return total;
  }

  _getBestCombo() {
    let best = 0;
    for (const id of this.save.heroes.getHeroIds()) {
      best = Math.max(best, this.save.heroes.getHero(id).records.bestCombo || 0);
    }
    return best;
  }

  _getTotalUnlockedSkins() {
    let total = 0;
    for (const skins of Object.values(this.save.account.unlockedSkins || {})) {
      total += (skins || []).length;
    }
    return total;
  }

  _grantReward(reward = {}) {
    if (!reward) return;
    for (const [type, amount] of Object.entries(reward)) {
      if (amount && amount > 0) {
        this.save.account.addCurrency(type, amount);
      }
    }
  }
}
