import { createDefaultHero } from './schemas.js';
import { HEROES, HERO_LEVEL_GROWTH } from '../config/index.js';

export class HeroCollection {
  constructor(data) {
    this._data = data;
  }

  toJSON() {
    return this._data;
  }

  getHeroIds() {
    return Object.keys(this._data);
  }

  getHero(id) {
    if (!this._data) this._data = {};
    if (!this._data[id]) {
      this._data[id] = createDefaultHero(id);
    }
    return this._data[id];
  }

  hasHero(id) {
    return !!this._data[id];
  }

  addHero(id) {
    if (!this._data[id]) {
      this._data[id] = createDefaultHero(id);
      return true;
    }
    return false;
  }

  getHeroExpToNext(id) {
    const hero = this.getHero(id);
    const base = HERO_LEVEL_GROWTH.baseExp;
    const growth = HERO_LEVEL_GROWTH.expGrowth;
    return Math.floor(base * Math.pow(growth, hero.level - 1));
  }

  addHeroExp(id, amount) {
    const hero = this.getHero(id);
    hero.exp += amount;
    let leveled = false;
    while (hero.exp >= this.getHeroExpToNext(id) && hero.level < HERO_LEVEL_GROWTH.maxLevel) {
      hero.exp -= this.getHeroExpToNext(id);
      hero.level++;
      leveled = true;
    }
    if (hero.level >= HERO_LEVEL_GROWTH.maxLevel) {
      hero.exp = 0;
    }
    return leveled;
  }

  upgradeStar(id) {
    const hero = this.getHero(id);
    const heroCfg = HEROES[id];
    if (!heroCfg) return false;
    const maxStars = heroCfg.maxStars || 5;
    if (hero.stars >= maxStars) return false;
    hero.stars++;
    return true;
  }

  getStarCost(id) {
    const hero = this.getHero(id);
    return (hero.stars + 1) * 50;
  }

  equipItem(id, type, equip) {
    const hero = this.getHero(id);
    const old = hero.equipment[type];
    hero.equipment[type] = equip;
    return old;
  }

  unequipItem(id, type) {
    const hero = this.getHero(id);
    const old = hero.equipment[type];
    hero.equipment[type] = null;
    return old;
  }

  updateSkillLevel(id, skillIndex, delta) {
    const hero = this.getHero(id);
    if (skillIndex < 0 || skillIndex >= hero.skillLevels.length) return false;
    hero.skillLevels[skillIndex] = Math.max(1, hero.skillLevels[skillIndex] + delta);
    return true;
  }

  unlockTalent(id, talentId) {
    const hero = this.getHero(id);
    if (!hero.talentNodes.includes(talentId)) {
      hero.talentNodes.push(talentId);
      return true;
    }
    return false;
  }

  recordPlay(id) {
    const hero = this.getHero(id);
    hero.records.playCount++;
  }

  recordRun(id, result) {
    const hero = this.getHero(id);
    hero.records.totalKills += result.kills || 0;
    hero.records.totalScore += result.score || 0;
    hero.records.bestCombo = Math.max(hero.records.bestCombo, result.maxCombo || 0);

    if (result.cleared && result.chapter > hero.records.highestChapter) {
      hero.records.highestChapter = result.chapter;
    }
  }
}
