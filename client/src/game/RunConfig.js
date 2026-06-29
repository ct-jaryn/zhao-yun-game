import { HEROES, DIFFICULTY, EQUIP_TYPES } from '../config/index.js';
import { SaveManager } from '../save/SaveManager.js';

export class RunConfig {
  constructor({ heroId, skin, chapter, difficulty, mode = 'story', challenge = null }) {
    this.heroId = heroId;
    this.skin = skin;
    this.chapter = chapter;
    this.difficulty = difficulty;
    this.mode = mode;
    this.challenge = challenge;
  }

  static fromStory(heroId, skin, chapter, difficulty = 'normal') {
    return new RunConfig({ heroId, skin, chapter, difficulty, mode: 'story' });
  }

  static fromEndless(heroId, skin, difficulty = 'normal') {
    return new RunConfig({ heroId, skin, chapter: 1, difficulty, mode: 'endless' });
  }

  static fromDaily(heroId, skin, chapter, difficulty, modifier) {
    return new RunConfig({
      heroId,
      skin,
      chapter,
      difficulty,
      mode: 'daily',
      challenge: modifier
    });
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
    stats.skillBranches = heroCfg.skillBranches || [];
    stats.skillBranchSelections = hero.skillBranchSelections || {};

    // 应用天赋
    const talentEffects = this._collectTalentEffects(heroCfg, hero.talentNodes);
    for (const [k, v] of Object.entries(talentEffects)) {
      if (k === 'spd') {
        stats.spd += v * 15;
      } else if (stats[k] !== undefined) {
        stats[k] += v;
      }
    }
    stats.talentEffects = talentEffects;

    // 应用每日挑战对玩家的修正
    if (this.challenge) {
      if (this.challenge.playerHpMult) stats.maxHp = Math.floor(stats.maxHp * this.challenge.playerHpMult);
      if (this.challenge.playerAtkMult) stats.atk = Math.floor(stats.atk * this.challenge.playerAtkMult);
      if (this.challenge.playerMpRegenMult) stats.mpRegen = stats.mpRegen * this.challenge.playerMpRegenMult;
      if (this.challenge.skillDmgMult) {
        stats.skillDamageMult = stats.skillDamageMult.map(m => m * this.challenge.skillDmgMult);
      }
    }

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

  _collectTalentEffects(heroCfg, talentNodes) {
    const effects = {};
    const nodes = talentNodes || [];
    const branchTotals = {};
    const branchMaxLevels = {};

    for (const nodeId of nodes) {
      const [branchId, levelStr] = nodeId.split('_');
      const level = parseInt(levelStr, 10);
      const branch = (heroCfg.talentBranches || []).find(b => b.id === branchId);
      if (!branch || !branch.effects || level < 1 || level > branch.effects.length) continue;
      const effect = branch.effects[level - 1];
      if (!branchTotals[branchId]) branchTotals[branchId] = {};
      if (!branchMaxLevels[branchId] || level > branchMaxLevels[branchId]) {
        branchMaxLevels[branchId] = level;
      }
      for (const [k, v] of Object.entries(effect)) {
        branchTotals[branchId][k] = (branchTotals[branchId][k] || 0) + v;
      }
    }

    for (const branch of (heroCfg.talentBranches || [])) {
      const branchId = branch.id;
      const total = branchTotals[branchId] || {};
      const maxLevel = branchMaxLevels[branchId] || 0;
      const completed = maxLevel >= 3;
      const mult = completed ? 1.5 : 1;
      for (const [k, v] of Object.entries(total)) {
        effects[k] = (effects[k] || 0) + Math.floor(v * mult);
      }
    }

    return effects;
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
