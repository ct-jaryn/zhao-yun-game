import { RANK_REWARDS } from '../config/index.js';

export class Account {
  constructor(data) {
    this._data = data;
  }

  toJSON() {
    return this._data;
  }

  get rank() { return this._data.rank || 1; }
  get rankExp() { return this._data.rankExp || 0; }

  get currencies() { return this._data.currencies || {}; }
  get gems() { return this._data.gems || []; }

  getCurrency(type) {
    return (this._data.currencies && this._data.currencies[type]) || 0;
  }

  addCurrency(type, amount) {
    if (!this._data.currencies[type]) this._data.currencies[type] = 0;
    this._data.currencies[type] += amount;
    if (this._data.currencies[type] < 0) this._data.currencies[type] = 0;
    return this._data.currencies[type];
  }

  consumeCurrency(type, amount) {
    if (this.getCurrency(type) < amount) return false;
    this.addCurrency(type, -amount);
    return true;
  }

  getRankExpToNext() {
    const base = 1000;
    const growth = 1.15;
    return Math.floor(base * Math.pow(growth, this._data.rank - 1));
  }

  addRankExp(amount) {
    this._data.rankExp += amount;
    let leveled = false;
    while (this._data.rankExp >= this.getRankExpToNext()) {
      this._data.rankExp -= this.getRankExpToNext();
      this._data.rank++;
      leveled = true;
      this._applyRankUpRewards();
    }
    return leveled;
  }

  _applyRankUpRewards() {
    const reward = RANK_REWARDS[this._data.rank];
    if (!reward) return;
    if (reward.coins) this.addCurrency('coins', reward.coins);
    if (reward.souls) this.addCurrency('souls', reward.souls);
    if (reward.gems) this.addCurrency('gems', reward.gems);
    if (reward.merit) this.addCurrency('merit', reward.merit);
    if (reward.inventoryCapacity) {
      this._pendingInventoryCapacity = (this._pendingInventoryCapacity || 0) + reward.inventoryCapacity;
    }
    if (reward.unlockSkin) {
      this.unlockSkin(reward.unlockSkin.heroId, reward.unlockSkin.skin);
    }
    if (reward.unlockHero) {
      this.unlockHero(reward.unlockHero);
    }
  }

  consumePendingInventoryCapacity() {
    const amount = this._pendingInventoryCapacity || 0;
    this._pendingInventoryCapacity = 0;
    return amount;
  }

  isHeroUnlocked(id) {
    return this._data.unlockedHeroes.includes(id);
  }

  unlockHero(id) {
    if (!this._data.unlockedHeroes.includes(id)) {
      this._data.unlockedHeroes.push(id);
      if (!this._data.unlockedSkins[id]) {
        this._data.unlockedSkins[id] = ['classic'];
      }
      return true;
    }
    return false;
  }

  isChapterUnlocked(chapter) {
    return this._data.unlockedChapters.includes(chapter);
  }

  unlockChapter(chapter) {
    if (!this._data.unlockedChapters.includes(chapter)) {
      this._data.unlockedChapters.push(chapter);
      return true;
    }
    return false;
  }

  isSkinUnlocked(heroId, skin) {
    const skins = this._data.unlockedSkins[heroId];
    return skins && skins.includes(skin);
  }

  unlockSkin(heroId, skin) {
    if (!this._data.unlockedSkins[heroId]) {
      this._data.unlockedSkins[heroId] = ['classic'];
    }
    if (!this._data.unlockedSkins[heroId].includes(skin)) {
      this._data.unlockedSkins[heroId].push(skin);
      return true;
    }
    return false;
  }

  addGem(gem) {
    if (!this._data.gems) this._data.gems = [];
    this._data.gems.push(gem);
    return this._data.gems.length;
  }

  removeGem(index) {
    if (!this._data.gems || index < 0 || index >= this._data.gems.length) return null;
    return this._data.gems.splice(index, 1)[0];
  }

  resetDailyIfNeeded() {
    const today = new Date().toISOString().slice(0, 10);
    if (this._data.daily.lastResetDate !== today) {
      this._data.daily.lastResetDate = today;
      this._data.daily.challengeCompletions = 0;
      this._data.daily.claimedRewards = [];
      return true;
    }
    return false;
  }
}
