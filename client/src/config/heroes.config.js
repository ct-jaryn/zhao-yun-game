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
      { id: 'dragon', name: '龙胆', desc: '生存与反杀' },
      { id: 'spear', name: '枪神', desc: '普攻与技能伤害' },
      { id: 'charge', name: '无双', desc: '突进与连击' }
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
      { id: 'charm', name: '魅惑', desc: '控制与削弱' },
      { id: 'dance', name: '惊鸿', desc: '范围伤害' },
      { id: 'grace', name: '倾城', desc: '生存与辅助' }
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
      { id: 'rage', name: '狂暴', desc: '伤害与吸血' },
      { id: 'fury', name: '怒战', desc: '连击与暴击' },
      { id: 'maul', name: '恶来', desc: '爆发与不屈' }
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
      { id: 'sky', name: '天威', desc: '真实伤害' },
      { id: 'war', name: '战神', desc: '范围爆发' },
      { id: 'tyrant', name: '霸主', desc: '压制与吸血' }
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
      { id: 'shield', name: '虎卫', desc: '防御与嘲讽' },
      { id: 'hammer', name: '巨锤', desc: '范围控制' },
      { id: 'fortress', name: '铁壁', desc: '生存与反伤' }
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
