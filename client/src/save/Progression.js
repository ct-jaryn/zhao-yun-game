import { EQUIP_TYPES } from '../config/index.js';

export class Progression {
  constructor(data) {
    this._data = data;
  }

  toJSON() {
    return this._data;
  }

  hasAchievement(id) {
    return this._data.achievements.includes(id);
  }

  grantAchievement(id) {
    if (!this._data.achievements.includes(id)) {
      this._data.achievements.push(id);
      return true;
    }
    return false;
  }

  recordClear(chapter, difficulty, heroId) {
    const exists = this._data.clears.find(c =>
      c.chapter === chapter && c.difficulty === difficulty && c.heroId === heroId
    );
    if (!exists) {
      this._data.clears.push({ chapter, difficulty, heroId, date: Date.now() });
    }
  }

  getHighestClearChapter(difficulty = null, heroId = null) {
    let max = 0;
    for (const c of this._data.clears) {
      if (difficulty && c.difficulty !== difficulty) continue;
      if (heroId && c.heroId !== heroId) continue;
      max = Math.max(max, c.chapter);
    }
    return max;
  }

  discoverEquip(equip) {
    if (!equip || !equip.type) return;
    const listKey = this._typeToCodexKey(equip.type);
    const list = this._data.codex[listKey];
    if (!list) return;

    const id = this._equipCodexId(equip);
    if (!list.includes(id)) {
      list.push(id);
    }

    if (equip.setTag) {
      if (!this._data.codex.sets[equip.setTag]) {
        this._data.codex.sets[equip.setTag] = 0;
      }
      this._data.codex.sets[equip.setTag] = Math.max(
        this._data.codex.sets[equip.setTag],
        equip.setPieces || 1
      );
    }
  }

  recordEndless(time, kills, wave) {
    this._data.endless.bestTime = Math.max(this._data.endless.bestTime, time);
    this._data.endless.bestKills = Math.max(this._data.endless.bestKills, kills);
    this._data.endless.bestWave = Math.max(this._data.endless.bestWave, wave);
  }

  _typeToCodexKey(type) {
    const map = { '武器': 'weapons', '铠甲': 'armors', '头盔': 'helmets', '靴子': 'boots', '饰品': 'accessories' };
    return map[type] || 'weapons';
  }

  _equipCodexId(equip) {
    return `${equip.name}_${equip.tier}`;
  }
}
