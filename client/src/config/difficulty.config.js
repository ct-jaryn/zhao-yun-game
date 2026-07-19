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
    bossDropCountBonus: 0,
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
    bossDropCountBonus: 0,
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
    bossDropCountBonus: 1,
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
    bossDropCountBonus: 2,
    eliteChance: 0.4,
    affixes: ['狂暴', '铁壁']
  }
};

// 难度词缀是独立于基础倍率的额外规则，便于后续扩展章节专属词缀。
export const DIFFICULTY_AFFIXES = {
  '狂暴': {
    name: '狂暴',
    description: '攻击力 +15%，移动速度 +8%',
    atkMult: 1.15,
    speedMult: 1.08
  },
  '铁壁': {
    name: '铁壁',
    description: '最大生命 +18%，防御力 +25%',
    hpMult: 1.18,
    defMult: 1.25
  }
};

export function getDifficultyList() {
  return Object.values(DIFFICULTY);
}

export function getDifficulty(id) {
  return DIFFICULTY[id] || DIFFICULTY.normal;
}
