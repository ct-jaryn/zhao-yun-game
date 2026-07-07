export const EQUIP_TYPES = ['武器', '铠甲', '头盔', '靴子', '饰品'];
export const EQUIP_ICONS = { '武器':'⚔️', '铠甲':'🛡️', '头盔':'⛑️', '靴子':'👢', '饰品':'💎' };
export const EQUIP_TYPE_TIER_IMAGES = {
  '武器': [
    '/equipment/weapon_0.png',
    '/equipment/weapon_1.png',
    '/equipment/weapon_2.png',
    '/equipment/weapon_3.png',
    '/equipment/weapon_4.png'
  ],
  '铠甲': [
    '/equipment/armor_0.png',
    '/equipment/armor_1.png',
    '/equipment/armor_2.png',
    '/equipment/armor_3.png',
    '/equipment/armor_4.png'
  ],
  '头盔': [
    '/equipment/helmet_0.png',
    '/equipment/helmet_1.png',
    '/equipment/helmet_2.png',
    '/equipment/helmet_3.png',
    '/equipment/helmet_4.png'
  ],
  '靴子': [
    '/equipment/boots_0.png',
    '/equipment/boots_1.png',
    '/equipment/boots_2.png',
    '/equipment/boots_3.png',
    '/equipment/boots_4.png'
  ],
  '饰品': [
    '/equipment/accessory_0.png',
    '/equipment/accessory_1.png',
    '/equipment/accessory_2.png',
    '/equipment/accessory_3.png',
    '/equipment/accessory_4.png'
  ]
};
export const EQUIP_STAT_LABELS = { atk:'攻击', def:'防御', hp:'生命', mp:'法力', crit:'暴击', spd:'速度' };

export const QUALITY_STAR_IMAGE = '/generated/quality_star.png';

// 赵云专属装备套装：从初始布衣木枪到最终最强一套
export const ZHAO_YUN_EQUIP_TIERS = [
  { // 初始
    '武器': { name:'木枪', stats:{ atk:3 } },
    '铠甲': { name:'布衣', stats:{ def:2, hp:10 } },
    '头盔': { name:'布巾', stats:{ def:1, hp:5 } },
    '靴子': { name:'草鞋', stats:{ spd:1 } },
    '饰品': { name:'木佩', stats:{ hp:5, mp:5 } }
  },
  { // 前期
    '武器': { name:'铁枪', stats:{ atk:6 } },
    '铠甲': { name:'皮甲', stats:{ def:4, hp:20 } },
    '头盔': { name:'皮盔', stats:{ def:2, hp:10 } },
    '靴子': { name:'皮靴', stats:{ spd:2, def:1 } },
    '饰品': { name:'铜镜', stats:{ hp:10, mp:10 } }
  },
  { // 中期
    '武器': { name:'亮银枪', stats:{ atk:10, crit:3 } },
    '铠甲': { name:'锁子甲', stats:{ def:7, hp:35 } },
    '头盔': { name:'精钢盔', stats:{ def:4, hp:18 } },
    '靴子': { name:'战靴', stats:{ spd:3, def:2 } },
    '饰品': { name:'龙纹玉', stats:{ hp:18, mp:15 } }
  },
  { // 后期
    '武器': { name:'涯角枪', stats:{ atk:16, crit:5 } },
    '铠甲': { name:'明光铠', stats:{ def:11, hp:55 } },
    '头盔': { name:'凤翅盔', stats:{ def:6, hp:28 } },
    '靴子': { name:'追风靴', stats:{ spd:4, def:3 } },
    '饰品': { name:'龙胆佩', stats:{ hp:28, mp:25 } }
  },
  { // 最终 / 赵云最强一套
    '武器': { name:'龙胆亮银枪', stats:{ atk:25, crit:8 } },
    '铠甲': { name:'龙鳞宝甲', stats:{ def:18, hp:90 } },
    '头盔': { name:'飞龙盔', stats:{ def:10, hp:45 } },
    '靴子': { name:'腾云靴', stats:{ spd:6, def:5 } },
    '饰品': { name:'真龙璧', stats:{ hp:45, mp:40 } }
  }
];

export const QUALITY = [
  { name:'普通', color:'#e8e8e8', mult:1.0 },   // 白色
  { name:'精良', color:'#44ff44', mult:1.3 },   // 绿色
  { name:'稀有', color:'#4488ff', mult:1.6 },   // 蓝色
  { name:'史诗', color:'#aa44ff', mult:2.0 },   // 紫色
  { name:'传说', color:'#ffd700', mult:2.5 }    // 金色
];

// 装备经济公式配置
export const EQUIPMENT_ECONOMY = {
  enhance: {
    maxLevelBase: 5,
    maxLevelPerQuality: 3,
    costCoinBase: 50,
    costStoneBase: 5,
    costQualityMult: 0.2,
    bonusRateBase: 0.05,
    bonusRateQualityMult: 0.1
  },
  refine: {
    maxLevelBase: 3,
    maxLevelPerQuality: 2,
    costCoinBase: 80,
    costStoneBase: 3,
    costQualityMult: 0.3,
    bonusRateBase: 0.04,
    bonusRateQualityMult: 0.15
  },
  wash: {
    costCoinBase: 200,
    costStoneBase: 2,
    costQualityMult: 0.4,
    costStoneQualityMult: 0.2,
    rollCountBase: 1,
    rollCountMaxBonus: 3,
    positiveRate: 0.85,
    valueMinRate: 0.2,
    valueMaxRate: 0.7,
    valueQualityMult: 0.2
  },
  salvage: {
    coinBase: 10,
    stoneBase: 2,
    refineStoneBase: 1,
    enhanceLevelMult: 0.2,
    refineLevelMult: 0.3,
    enhanceStoneMult: 0.5,
    refineStoneMult: 0.5
  },
  gem: {
    socketBase: 1,
    socketPerQuality: 0.5
  }
};
