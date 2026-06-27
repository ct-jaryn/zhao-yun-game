import { HEROES, DIFFICULTY, EQUIP_TYPES } from '../config/index.js';
import { SaveManager } from '../save/SaveManager.js';

export class RunConfig {
  constructor({ heroId, skin, chapter, difficulty, mode = 'story' }) {
    this.heroId = heroId;
    this.skin = skin;
    this.chapter = chapter;
    this.difficulty = difficulty;
    this.mode = mode;
  }

  static fromStory(heroId, skin, chapter, difficulty = 'normal') {
    return new RunConfig({ heroId, skin, chapter, difficulty, mode: 'story' });
  }

  static fromEndless(heroId, skin, difficulty = 'normal') {
    return new RunConfig({ heroId, skin, chapter: 1, difficulty, mode: 'endless' });
  }

  toCombatStats() {
    const save = SaveManager.getInstance();
    const hero = save.heroes.getHero(this.heroId);
    const heroCfg = HEROES[this.heroId];
    if (!heroCfg) throw new Error(`未知英雄: ${this.heroId}`);

    const base = heroCfg.baseStats;
    const growth = heroCfg.growth;
    const level = hero.level;
    const stars = hero.stars;

    const starMult = 1 + stars * 0.05;

    let stats = {
      maxHp: (base.hp + growth.hp * (level - 1)) * starMult,
      maxMp: (base.mp + growth.mp * (level - 1)) * starMult,
      atk: (base.atk + growth.atk * (level - 1)) * starMult,
      def: (base.def + growth.def * (level - 1)) * starMult,
      crit: base.crit + growth.crit * (level - 1),
      spd: base.spd + growth.spd * (level - 1),
      mpRegen: base.mpRegen + growth.mpRegen * (level - 1),
      hpRegen: base.hpRegen + growth.hpRegen * (level - 1),
      radius: 36,
      skin: this.skin,
      heroId: this.heroId,
      passive: heroCfg.passive
    };

    // 应用装备属性
    for (const type of EQUIP_TYPES) {
      const eq = hero.equipment[type];
      if (!eq) continue;
      for (const [k, v] of Object.entries(eq.stats)) {
        if (k === 'spd') {
          stats.spd += v * 15;
        } else if (stats[k] !== undefined) {
          stats[k] += v;
        }
      }
    }

    // 应用技能等级加成（先简单处理：每级 +2% 对应技能伤害）
    stats.skillDamageMult = hero.skillLevels.map(lv => 1 + (lv - 1) * 0.02);

    // 应用天赋（由 Lobby/Talent 系统注入，这里先预留）
    stats.talentEffects = this._collectTalentEffects(hero.talentNodes);

    // 数值取整
    stats.maxHp = Math.floor(stats.maxHp);
    stats.maxMp = Math.floor(stats.maxMp);
    stats.atk = Math.floor(stats.atk);
    stats.def = Math.floor(stats.def);
    stats.crit = Math.floor(stats.crit * 10) / 10;
    stats.spd = Math.floor(stats.spd);

    return stats;
  }

  getDifficultyConfig() {
    return DIFFICULTY[this.difficulty] || DIFFICULTY.normal;
  }

  _collectTalentEffects(talentNodes) {
    // 天赋效果由外部系统解析，这里只返回节点 ID 列表
    return talentNodes || [];
  }

  toJSON() {
    return {
      heroId: this.heroId,
      skin: this.skin,
      chapter: this.chapter,
      difficulty: this.difficulty,
      mode: this.mode
    };
  }
}
