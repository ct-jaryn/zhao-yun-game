export const DAILY_MODIFIERS = [
  {
    id: 'hp_surge',
    name: '血潮',
    desc: '敌人生命值 +50%',
    enemyHpMult: 1.5
  },
  {
    id: 'fury',
    name: '狂暴',
    desc: '敌人攻击力 +40%',
    enemyAtkMult: 1.4
  },
  {
    id: 'swarm',
    name: '虫群',
    desc: '敌人移速 +30%，刷新更快',
    enemySpeedMult: 1.3,
    spawnRateMult: 0.7
  },
  {
    id: 'iron_wall',
    name: '铁壁',
    desc: '敌人防御 +50%',
    enemyDefMult: 1.5
  },
  {
    id: 'fragile',
    name: '脆弱',
    desc: '玩家生命 -30%，攻击 +30%',
    playerHpMult: 0.7,
    playerAtkMult: 1.3
  },
  {
    id: 'mana_drought',
    name: '干旱',
    desc: '法力回复 -50%，技能伤害 +40%',
    playerMpRegenMult: 0.5,
    skillDmgMult: 1.4
  }
];

export const DAILY_DIFFICULTY_REWARDS = {
  normal: { coins: 800, souls: 50, gems: 10 },
  hard: { coins: 1500, souls: 100, gems: 20 },
  hell: { coins: 3000, souls: 200, gems: 40 }
};

/**
 * 基于日期字符串生成确定性每日挑战
 */
export function generateDailyChallenge(dateStr, unlockedHeroes, unlockedChapters) {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = ((seed << 5) - seed) + dateStr.charCodeAt(i);
    seed |= 0;
  }
  const abs = Math.abs(seed);

  const hero = unlockedHeroes[abs % unlockedHeroes.length];
  const chapter = unlockedChapters[(abs >> 4) % unlockedChapters.length] || 1;
  const difficulty = ['normal', 'hard', 'hell'][(abs >> 8) % 3];
  const modifier = DAILY_MODIFIERS[(abs >> 12) % DAILY_MODIFIERS.length];

  return {
    dateStr,
    heroId: hero,
    chapter,
    difficulty,
    modifier
  };
}
