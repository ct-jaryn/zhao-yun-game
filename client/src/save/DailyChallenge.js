import { generateDailyChallenge, DAILY_DIFFICULTY_REWARDS } from '../config/index.js';

export class DailyChallenge {
  constructor(saveManager) {
    this.save = saveManager;
  }

  getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  resetIfNeeded() {
    const today = this.getTodayStr();
    if (this.save.account._data.daily.lastResetDate !== today) {
      this.save.account._data.daily.lastResetDate = today;
      this.save.account._data.daily.challengeCompletions = 0;
      this.save.account._data.daily.claimedRewards = [];
      this.save.persist();
      return true;
    }
    return false;
  }

  getTodayChallenge() {
    this.resetIfNeeded();
    const today = this.getTodayStr();
    const unlockedHeroes = this.save.account.unlockedHeroes || ['zhaoyun'];
    const unlockedChapters = this.save.account.unlockedChapters || [1];
    return generateDailyChallenge(today, unlockedHeroes, unlockedChapters);
  }

  getRewards(difficulty, firstClear = true) {
    const base = DAILY_DIFFICULTY_REWARDS[difficulty] || DAILY_DIFFICULTY_REWARDS.normal;
    if (!firstClear) {
      return {
        coins: Math.floor(base.coins * 0.2),
        souls: Math.floor(base.souls * 0.2),
        gems: Math.floor(base.gems * 0.2)
      };
    }
    return { ...base };
  }

  canComplete() {
    this.resetIfNeeded();
    return this.save.account._data.daily.challengeCompletions < 3;
  }

  recordCompletion(difficulty) {
    this.resetIfNeeded();
    const firstClear = this.save.account._data.daily.challengeCompletions === 0;
    this.save.account._data.daily.challengeCompletions++;
    const rewards = this.getRewards(difficulty, firstClear);
    this.save.account._data.daily.claimedRewards.push({
      date: this.getTodayStr(),
      difficulty,
      rewards,
      timestamp: Date.now()
    });
    for (const [type, amount] of Object.entries(rewards)) {
      this.save.account.addCurrency(type, amount);
    }
    this.save.persist();
    return { firstClear, rewards };
  }
}
