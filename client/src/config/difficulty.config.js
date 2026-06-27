export const DIFFICULTY = {
  normal: {
    id: 'normal',
    name: '普通',
    enemyHp: 1.0,
    enemyAtk: 1.0,
    enemyDef: 1.0,
    enemySpeed: 1.0,
    expMult: 1.0,
    coinMult: 1.0,
    scoreMult: 1.0,
    dropBonus: 0,
    eliteChance: 0,
    affixes: []
  },
  hard: {
    id: 'hard',
    name: '困难',
    enemyHp: 1.6,
    enemyAtk: 1.4,
    enemyDef: 1.2,
    enemySpeed: 1.1,
    expMult: 1.2,
    coinMult: 1.3,
    scoreMult: 1.3,
    dropBonus: 1,
    eliteChance: 0.1,
    affixes: []
  },
  hell: {
    id: 'hell',
    name: '修罗',
    enemyHp: 2.5,
    enemyAtk: 2.0,
    enemyDef: 1.5,
    enemySpeed: 1.2,
    expMult: 1.5,
    coinMult: 1.8,
    scoreMult: 1.8,
    dropBonus: 2,
    eliteChance: 0.25,
    affixes: ['狂暴']
  },
  reincarnation: {
    id: 'reincarnation',
    name: '轮回',
    enemyHp: 4.0,
    enemyAtk: 3.0,
    enemyDef: 2.0,
    enemySpeed: 1.3,
    expMult: 2.0,
    coinMult: 2.5,
    scoreMult: 2.5,
    dropBonus: 3,
    eliteChance: 0.4,
    affixes: ['狂暴', '铁壁']
  }
};

export function getDifficultyList() {
  return Object.values(DIFFICULTY);
}

export function getDifficulty(id) {
  return DIFFICULTY[id] || DIFFICULTY.normal;
}
