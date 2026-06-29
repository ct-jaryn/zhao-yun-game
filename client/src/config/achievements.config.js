export const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    name: '初出茅庐',
    desc: '首次击杀敌人',
    icon: '🩸',
    condition: { type: 'totalKills', value: 1 },
    reward: { coins: 100 }
  },
  {
    id: 'novice_slayer',
    name: '百人斩',
    desc: '累计击杀 100 名敌人',
    icon: '⚔️',
    condition: { type: 'totalKills', value: 100 },
    reward: { coins: 500 }
  },
  {
    id: 'veteran_slayer',
    name: '千人斩',
    desc: '累计击杀 500 名敌人',
    icon: '💀',
    condition: { type: 'totalKills', value: 500 },
    reward: { coins: 2000, souls: 100 }
  },
  {
    id: 'master_slayer',
    name: '万人敌',
    desc: '累计击杀 2000 名敌人',
    icon: '👑',
    condition: { type: 'totalKills', value: 2000 },
    reward: { coins: 10000, souls: 500 }
  },
  {
    id: 'combo_initiate',
    name: '连击新手',
    desc: '单次战斗达成 10 连击',
    icon: '🔥',
    condition: { type: 'bestCombo', value: 10 },
    reward: { coins: 200 }
  },
  {
    id: 'combo_master',
    name: '连击大师',
    desc: '单次战斗达成 30 连击',
    icon: '⚡',
    condition: { type: 'bestCombo', value: 30 },
    reward: { coins: 1000, souls: 50 }
  },
  {
    id: 'combo_legend',
    name: '连击传说',
    desc: '单次战斗达成 50 连击',
    icon: '🌟',
    condition: { type: 'bestCombo', value: 50 },
    reward: { coins: 5000, souls: 200 }
  },
  {
    id: 'chapter1_hero',
    name: '虎牢英雄',
    desc: '通关第一章 · 虎牢救美',
    icon: '🛡️',
    condition: { type: 'chapterClear', value: 1 },
    reward: { souls: 100 }
  },
  {
    id: 'chapter2_hero',
    name: '宛城铁壁',
    desc: '通关第二章 · 血战宛城',
    icon: '🏰',
    condition: { type: 'chapterClear', value: 2 },
    reward: { souls: 150 }
  },
  {
    id: 'chapter3_hero',
    name: '渭水蛟龙',
    desc: '通关第三章 · 渭水怒涛',
    icon: '🌊',
    condition: { type: 'chapterClear', value: 3 },
    reward: { souls: 200 }
  },
  {
    id: 'chapter4_hero',
    name: '下邳无双',
    desc: '通关第四章 · 下邳焚天',
    icon: '🔥',
    condition: { type: 'chapterClear', value: 4 },
    reward: { souls: 500, gems: 100 }
  },
  {
    id: 'endless_wave5',
    name: '无尽新兵',
    desc: '无尽模式达到第 5 波',
    icon: '🌑',
    condition: { type: 'endlessWave', value: 5 },
    reward: { coins: 500 }
  },
  {
    id: 'endless_wave10',
    name: '无尽勇士',
    desc: '无尽模式达到第 10 波',
    icon: '🌗',
    condition: { type: 'endlessWave', value: 10 },
    reward: { coins: 2000, souls: 100 }
  },
  {
    id: 'endless_wave20',
    name: '无尽战神',
    desc: '无尽模式达到第 20 波',
    icon: '🌕',
    condition: { type: 'endlessWave', value: 20 },
    reward: { coins: 10000, souls: 500, gems: 200 }
  },
  {
    id: 'rich_man',
    name: '富甲一方',
    desc: '拥有 10000 铜币',
    icon: '💰',
    condition: { type: 'currency', currency: 'coins', value: 10000 },
    reward: { souls: 100 }
  },
  {
    id: 'soul_collector',
    name: '将魂聚集',
    desc: '拥有 5000 将魂',
    icon: '💎',
    condition: { type: 'currency', currency: 'souls', value: 5000 },
    reward: { gems: 100 }
  },
  {
    id: 'rank_10',
    name: '百战老兵',
    desc: '账号等级达到 10 级',
    icon: '🎖️',
    condition: { type: 'rank', value: 10 },
    reward: { gems: 200 }
  },
  {
    id: 'hero_collector',
    name: '群雄并起',
    desc: '解锁 3 名英雄',
    icon: '🤝',
    condition: { type: 'unlockedHeroes', value: 3 },
    reward: { souls: 300 }
  },
  {
    id: 'skin_collector',
    name: '锦衣夜行',
    desc: '累计解锁 5 个皮肤',
    icon: '👘',
    condition: { type: 'unlockedSkins', value: 5 },
    reward: { gems: 150 }
  },
  {
    id: 'veteran_commander',
    name: '身经百战',
    desc: '累计通关 20 次',
    icon: '📜',
    condition: { type: 'totalClears', value: 20 },
    reward: { coins: 5000, souls: 300 }
  }
];
