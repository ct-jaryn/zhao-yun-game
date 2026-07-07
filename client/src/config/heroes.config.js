// 英雄基础配置
// 运行时属性 = baseStats + growth * (level - 1) + 装备 + 天赋

export const HERO_LEVEL_GROWTH = {
  maxLevel: 60,
  baseExp: 100,
  expGrowth: 1.2
};

export const HEROES = {
  zhaoyun: {
    id: 'zhaoyun',
    name: '赵云',
    title: '子龙',
    affinity: 'shu',
    rarity: 3,
    maxStars: 5,
    description: '常山赵子龙，均衡型战士，擅长连击与突进。',
    passive: {
      name: '龙胆',
      description: '生命值低于 30% 时，伤害提升 25%。'
    },
    baseStats: {
      hp: 150,
      mp: 80,
      atk: 20,
      def: 8,
      crit: 5,
      spd: 200,
      mpRegen: 3,
      hpRegen: 1
    },
    growth: {
      hp: 15,
      mp: 5,
      atk: 3,
      def: 2,
      crit: 0.2,
      spd: 2,
      mpRegen: 0.1,
      hpRegen: 0.05
    },
    skins: {
      classic: { name: '经典', unlock: '初始' },
      mecha: { name: '机甲赵云', unlock: '账号军阶达到 10 级' }
    },
    talentBranches: [
      {
        id: 'dragon',
        name: '龙胆',
        desc: '生存与反杀',
        effects: [
          { maxHp: 20, hpRegen: 0.5 },
          { maxHp: 50, hpRegen: 1, def: 2 },
          { maxHp: 100, hpRegen: 2, def: 5 }
        ]
      },
      {
        id: 'spear',
        name: '枪神',
        desc: '普攻与技能伤害',
        effects: [
          { atk: 3, crit: 0.5 },
          { atk: 8, crit: 1.5 },
          { atk: 15, crit: 3 }
        ]
      },
      {
        id: 'charge',
        name: '无双',
        desc: '突进与连击',
        effects: [
          { spd: 1, maxMp: 10 },
          { spd: 2, maxMp: 25 },
          { spd: 4, maxMp: 50 }
        ]
      }
    ],
    skillBranches: [
      [
        { id: 'zhaoyun_j_1', name: '长枪', desc: '普攻距离 +25%', effects: { rangeMult: 1.25 } },
        { id: 'zhaoyun_j_2', name: '破军', desc: '普攻伤害 +20%', effects: { damageMult: 1.2 } }
      ],
      [
        { id: 'zhaoyun_k_1', name: '烈焰旋风', desc: '旋风范围 +20%', effects: { rangeMult: 1.2 } },
        { id: 'zhaoyun_k_2', name: '血刃旋风', desc: '旋风吸血 8%', effects: { lifesteal: 8 } }
      ],
      [
        { id: 'zhaoyun_l_1', name: '疾风突刺', desc: '突刺冷却 -25%', effects: { cooldownMult: 0.75 } },
        { id: 'zhaoyun_l_2', name: '裂空突刺', desc: '突刺伤害 +25%', effects: { damageMult: 1.25 } }
      ],
      [
        { id: 'zhaoyun_u_1', name: '燎原', desc: '烽火范围 +25%', effects: { rangeMult: 1.25 } },
        { id: 'zhaoyun_u_2', name: '爆燃', desc: '烽火暴击 +10%', effects: { critBonus: 10 } }
      ],
      [
        { id: 'zhaoyun_i_1', name: '龙威', desc: '枪绝伤害 +25%', effects: { damageMult: 1.25 } },
        { id: 'zhaoyun_i_2', name: '无双', desc: '枪绝范围 +20%', effects: { rangeMult: 1.2 } }
      ]
    ]
  },

  diaochan: {
    id: 'diaochan',
    name: '貂蝉',
    title: '闭月',
    affinity: 'qun',
    rarity: 3,
    maxStars: 5,
    description: '辅助型控制英雄，擅长魅惑与范围减速。',
    passive: {
      name: '闭月',
      description: '附近有敌人时，自动释放一次魅惑，冷却 8 秒。'
    },
    baseStats: {
      hp: 120,
      mp: 120,
      atk: 14,
      def: 5,
      crit: 8,
      spd: 190,
      mpRegen: 5,
      hpRegen: 0.8
    },
    growth: {
      hp: 12,
      mp: 8,
      atk: 2,
      def: 1,
      crit: 0.3,
      spd: 1.5,
      mpRegen: 0.15,
      hpRegen: 0.04
    },
    skins: {
      classic: { name: '经典', unlock: '通关第一章' }
    },
    talentBranches: [
      {
        id: 'charm',
        name: '魅惑',
        desc: '控制与削弱',
        effects: [
          { mpRegen: 1, crit: 0.5 },
          { mpRegen: 3, crit: 1 },
          { mpRegen: 6, crit: 2 }
        ]
      },
      {
        id: 'dance',
        name: '惊鸿',
        desc: '范围伤害',
        effects: [
          { atk: 2, spd: 1 },
          { atk: 6, spd: 2 },
          { atk: 12, spd: 4 }
        ]
      },
      {
        id: 'grace',
        name: '倾城',
        desc: '生存与辅助',
        effects: [
          { maxHp: 15, def: 1 },
          { maxHp: 35, def: 3 },
          { maxHp: 70, def: 6 }
        ]
      }
    ],
    skillBranches: [
      [
        { id: 'diaochan_j_1', name: '魅影', desc: '普攻距离 +25%', effects: { rangeMult: 1.25 } },
        { id: 'diaochan_j_2', name: '毒刃', desc: '普攻伤害 +20%', effects: { damageMult: 1.2 } }
      ],
      [
        { id: 'diaochan_k_1', name: '舞袖', desc: '旋风范围 +20%', effects: { rangeMult: 1.2 } },
        { id: 'diaochan_k_2', name: '吸血', desc: '旋风吸血 8%', effects: { lifesteal: 8 } }
      ],
      [
        { id: 'diaochan_l_1', name: '惊鸿', desc: '突刺冷却 -25%', effects: { cooldownMult: 0.75 } },
        { id: 'diaochan_l_2', name: '穿心', desc: '突刺伤害 +25%', effects: { damageMult: 1.25 } }
      ],
      [
        { id: 'diaochan_u_1', name: '倾城', desc: '烽火范围 +25%', effects: { rangeMult: 1.25 } },
        { id: 'diaochan_u_2', name: '魅惑', desc: '烽火暴击 +10%', effects: { critBonus: 10 } }
      ],
      [
        { id: 'diaochan_i_1', name: '闭月', desc: '枪绝伤害 +25%', effects: { damageMult: 1.25 } },
        { id: 'diaochan_i_2', name: '羞花', desc: '枪绝范围 +20%', effects: { rangeMult: 1.2 } }
      ]
    ]
  },

  dianwei: {
    id: 'dianwei',
    name: '典韦',
    title: '古之恶来',
    affinity: 'wei',
    rarity: 4,
    maxStars: 5,
    description: '狂战士，高伤害低防御，击杀回血。',
    passive: {
      name: '嗜血',
      description: '击杀敌人回复 3% 最大生命值。'
    },
    baseStats: {
      hp: 180,
      mp: 60,
      atk: 28,
      def: 5,
      crit: 6,
      spd: 185,
      mpRegen: 2,
      hpRegen: 1.2
    },
    growth: {
      hp: 18,
      mp: 3,
      atk: 4,
      def: 1,
      crit: 0.25,
      spd: 1.5,
      mpRegen: 0.08,
      hpRegen: 0.06
    },
    skins: {
      classic: { name: '经典', unlock: '将魂 ×500' }
    },
    talentBranches: [
      {
        id: 'rage',
        name: '狂暴',
        desc: '伤害与吸血',
        effects: [
          { atk: 4, hpRegen: 0.5 },
          { atk: 10, hpRegen: 1 },
          { atk: 20, hpRegen: 2 }
        ]
      },
      {
        id: 'fury',
        name: '怒战',
        desc: '连击与暴击',
        effects: [
          { crit: 0.8, spd: 1 },
          { crit: 2, spd: 2 },
          { crit: 4, spd: 4 }
        ]
      },
      {
        id: 'maul',
        name: '恶来',
        desc: '爆发与不屈',
        effects: [
          { maxHp: 25, def: 1 },
          { maxHp: 60, def: 3 },
          { maxHp: 120, def: 6 }
        ]
      }
    ],
    skillBranches: [
      [
        { id: 'dianwei_j_1', name: '狂斧', desc: '普攻距离 +25%', effects: { rangeMult: 1.25 } },
        { id: 'dianwei_j_2', name: '碎骨', desc: '普攻伤害 +20%', effects: { damageMult: 1.2 } }
      ],
      [
        { id: 'dianwei_k_1', name: '旋风', desc: '旋风范围 +20%', effects: { rangeMult: 1.2 } },
        { id: 'dianwei_k_2', name: '嗜血', desc: '旋风吸血 8%', effects: { lifesteal: 8 } }
      ],
      [
        { id: 'dianwei_l_1', name: '冲锋', desc: '突刺冷却 -25%', effects: { cooldownMult: 0.75 } },
        { id: 'dianwei_l_2', name: '重击', desc: '突刺伤害 +25%', effects: { damageMult: 1.25 } }
      ],
      [
        { id: 'dianwei_u_1', name: '怒火', desc: '烽火范围 +25%', effects: { rangeMult: 1.25 } },
        { id: 'dianwei_u_2', name: '暴烈', desc: '烽火暴击 +10%', effects: { critBonus: 10 } }
      ],
      [
        { id: 'dianwei_i_1', name: '恶来', desc: '枪绝伤害 +25%', effects: { damageMult: 1.25 } },
        { id: 'dianwei_i_2', name: '魔神', desc: '枪绝范围 +20%', effects: { rangeMult: 1.2 } }
      ]
    ]
  },

  lubu: {
    id: 'lubu',
    name: '吕布',
    title: '无双',
    affinity: 'qun',
    rarity: 5,
    maxStars: 5,
    description: '爆发型输出，真实伤害，攻击范围大。',
    passive: {
      name: '无双',
      description: '对 Boss 伤害提升 20%。'
    },
    baseStats: {
      hp: 200,
      mp: 70,
      atk: 32,
      def: 7,
      crit: 7,
      spd: 180,
      mpRegen: 2.5,
      hpRegen: 1
    },
    growth: {
      hp: 20,
      mp: 4,
      atk: 5,
      def: 1.5,
      crit: 0.3,
      spd: 1.2,
      mpRegen: 0.1,
      hpRegen: 0.05
    },
    skins: {
      classic: { name: '经典', unlock: '将魂 ×1500 或击败指定 Boss' }
    },
    talentBranches: [
      {
        id: 'sky',
        name: '天威',
        desc: '真实伤害',
        effects: [
          { atk: 5 },
          { atk: 12 },
          { atk: 25 }
        ]
      },
      {
        id: 'war',
        name: '战神',
        desc: '范围爆发',
        effects: [
          { maxHp: 20, atk: 2 },
          { maxHp: 50, atk: 5 },
          { maxHp: 100, atk: 10 }
        ]
      },
      {
        id: 'tyrant',
        name: '霸主',
        desc: '压制与吸血',
        effects: [
          { crit: 1, hpRegen: 0.5 },
          { crit: 2.5, hpRegen: 1 },
          { crit: 5, hpRegen: 2 }
        ]
      }
    ],
    skillBranches: [
      [
        { id: 'lubu_j_1', name: '方天', desc: '普攻距离 +25%', effects: { rangeMult: 1.25 } },
        { id: 'lubu_j_2', name: '无双', desc: '普攻伤害 +20%', effects: { damageMult: 1.2 } }
      ],
      [
        { id: 'lubu_k_1', name: '戟舞', desc: '旋风范围 +20%', effects: { rangeMult: 1.2 } },
        { id: 'lubu_k_2', name: '血戟', desc: '旋风吸血 8%', effects: { lifesteal: 8 } }
      ],
      [
        { id: 'lubu_l_1', name: '赤兔', desc: '突刺冷却 -25%', effects: { cooldownMult: 0.75 } },
        { id: 'lubu_l_2', name: '破军', desc: '突刺伤害 +25%', effects: { damageMult: 1.25 } }
      ],
      [
        { id: 'lubu_u_1', name: '天威', desc: '烽火范围 +25%', effects: { rangeMult: 1.25 } },
        { id: 'lubu_u_2', name: '战神', desc: '烽火暴击 +10%', effects: { critBonus: 10 } }
      ],
      [
        { id: 'lubu_i_1', name: '飞将', desc: '枪绝伤害 +25%', effects: { damageMult: 1.25 } },
        { id: 'lubu_i_2', name: '霸道', desc: '枪绝范围 +20%', effects: { rangeMult: 1.2 } }
      ]
    ]
  },

  xuzhu: {
    id: 'xuzhu',
    name: '许褚',
    title: '虎痴',
    affinity: 'wei',
    rarity: 4,
    maxStars: 5,
    description: '坦克型英雄，高防御，可嘲讽敌人。',
    passive: {
      name: '虎卫',
      description: '受到伤害有 20% 概率减免 50%。'
    },
    baseStats: {
      hp: 250,
      mp: 60,
      atk: 18,
      def: 14,
      crit: 3,
      spd: 170,
      mpRegen: 2,
      hpRegen: 1.5
    },
    growth: {
      hp: 25,
      mp: 3,
      atk: 2,
      def: 3,
      crit: 0.1,
      spd: 1,
      mpRegen: 0.08,
      hpRegen: 0.08
    },
    skins: {
      classic: { name: '经典', unlock: '将魂 ×1200' }
    },
    talentBranches: [
      {
        id: 'shield',
        name: '虎卫',
        desc: '防御与嘲讽',
        effects: [
          { def: 3, maxHp: 30 },
          { def: 8, maxHp: 70 },
          { def: 15, maxHp: 150 }
        ]
      },
      {
        id: 'hammer',
        name: '巨锤',
        desc: '范围控制',
        effects: [
          { atk: 2 },
          { atk: 6 },
          { atk: 12 }
        ]
      },
      {
        id: 'fortress',
        name: '铁壁',
        desc: '生存与反伤',
        effects: [
          { maxHp: 20, def: 2 },
          { maxHp: 45, def: 5 },
          { maxHp: 90, def: 10 }
        ]
      }
    ],
    skillBranches: [
      [
        { id: 'xuzhu_j_1', name: '虎爪', desc: '普攻距离 +25%', effects: { rangeMult: 1.25 } },
        { id: 'xuzhu_j_2', name: '巨力', desc: '普攻伤害 +20%', effects: { damageMult: 1.2 } }
      ],
      [
        { id: 'xuzhu_k_1', name: '虎啸', desc: '旋风范围 +20%', effects: { rangeMult: 1.2 } },
        { id: 'xuzhu_k_2', name: '铁壁', desc: '旋风吸血 8%', effects: { lifesteal: 8 } }
      ],
      [
        { id: 'xuzhu_l_1', name: '虎扑', desc: '突刺冷却 -25%', effects: { cooldownMult: 0.75 } },
        { id: 'xuzhu_l_2', name: '震地', desc: '突刺伤害 +25%', effects: { damageMult: 1.25 } }
      ],
      [
        { id: 'xuzhu_u_1', name: '虎卫', desc: '烽火范围 +25%', effects: { rangeMult: 1.25 } },
        { id: 'xuzhu_u_2', name: '金刚', desc: '烽火暴击 +10%', effects: { critBonus: 10 } }
      ],
      [
        { id: 'xuzhu_i_1', name: '虎痴', desc: '枪绝伤害 +25%', effects: { damageMult: 1.25 } },
        { id: 'xuzhu_i_2', name: '神卫', desc: '枪绝范围 +20%', effects: { rangeMult: 1.2 } }
      ]
    ]
  }
};

export const HERO_UNLOCK_CONDITIONS = {
  zhaoyun: { type: 'free' },
  diaochan: { type: 'clear', chapter: 1 },
  dianwei: { type: 'souls', amount: 500 },
  xuzhu: { type: 'souls', amount: 1200 },
  lubu: { type: 'souls', amount: 1500 }
};

export function getHeroList() {
  return Object.values(HEROES);
}

export function getHero(id) {
  return HEROES[id] || null;
}

// 战斗通用数值配置
export const HERO_COMBAT_CONFIG = {
  levelExp: {
    base: 100,
    growth: 1.25
  },
  levelUp: {
    atkBonus: 3,
    defBonus: 2,
    restoreHp: true,
    restoreMp: true
  },
  skillCast: {
    attackTimerBase: 0.25,
    attackTimerStep: 0.08,
    dash: {
      distance: 90,
      particleCount: 8
    },
    ultimate: {
      projectileSpeed: 350,
      projectileDmgRatio: 0.5,
      projectileSize: 5,
      projectileLife: 1.5,
      particleCount: 35,
      particleSpeed: 160,
      shake: 8,
      flashDuration: 0.25
    },
    skill3: {
      particleCount: 50,
      particleSpeed: 80,
      particleSize: 5,
      shake: 5,
      flashDuration: 0.2
    },
    skill1: {
      particleCount: 18,
      particleSpeed: 90,
      shake: 3
    }
  },
  dodge: {
    durationClassic: 0.25,
    durationMecha: 0.45,
    cooldownClassic: 0.8,
    cooldownMecha: 1.0,
    speedClassic: 400,
    speedMecha: 500,
    invulnExtra: 0.15,
    particleCount: 10,
    particleSpeed: 70
  },
  combo: {
    resetTime: 3,
    interruptionTextThreshold: 5,
    milestoneBonus: 0.2,
    milestoneEvery: 5
  },
  passives: {
    zhaoyun: { hpThreshold: 0.3, damageMult: 1.25 },
    lubu: { bossDamageMult: 1.2 },
    dianwei: { killHealRatio: 0.03 },
    xuzhu: { blockChance: 0.2, blockDamageMult: 0.5 },
    diaochan: { charmInterval: 8, charmRange: 200, charmDuration: 2.5 }
  },
  damage: {
    overlappingExtraDistance: 5
  },
  sprite: {
    targetHeightClassic: 210,
    targetHeightMecha: 270
  }
};
