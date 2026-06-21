export const W = 1000;
export const H = 700;
export const MAP_W = 3000;
export const MAP_H = 2000;
export const ASPECT = W / H;

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

export const SKILL_ICON_IMAGES = [
  '/generated/skill_normal.png',
  '/generated/skill_whirlwind.png',
  '/generated/skill_dash.png',
  '/generated/skill_fire.png',
  '/generated/skill_ultimate.png'
];

export const MECHA_SKILL_ICON_IMAGES = [
  '/player_mecha/skill_icons/skill_normal.png',
  '/player_mecha/skill_icons/skill_whirlwind.png',
  '/player_mecha/skill_icons/skill_dash.png',
  '/player_mecha/skill_icons/skill_fire.png',
  '/player_mecha/skill_icons/skill_ultimate.png'
];

export const HUD_ICON_IMAGES = {
  hp: '/generated/hud_hp.png',
  mp: '/generated/hud_mp.png',
  exp: '/generated/hud_exp.png'
};

export const STAT_ICON_IMAGES = {
  atk: '/generated/stat_atk.png',
  def: '/generated/stat_def.png',
  crit: '/generated/stat_crit.png',
  spd: '/generated/stat_spd.png'
};

export const SLOT_ICON_IMAGES = {
  '武器': '/generated/slot_weapon.png',
  '铠甲': '/generated/slot_armor.png',
  '头盔': '/generated/slot_helmet.png',
  '靴子': '/generated/slot_boots.png',
  '饰品': '/generated/slot_accessory.png'
};

export const REWARD_ICON_IMAGES = {
  atkUp: '/generated/stat_atk.png',
  critUp: '/generated/stat_crit.png',
  spdUp: '/generated/stat_spd.png',
  cdDown: '/generated/hud_mp.png',
  hpUp: '/generated/hud_hp.png',
  mpUp: '/generated/hud_mp.png',
  heal: '/generated/hud_hp.png'
};

export const QUALITY_STAR_IMAGE = '/generated/quality_star.png';
export const DIAOCHAN_AVATAR = '/generated/diaochan_avatar.png';
export const PLAYER_AVATAR = '/generated/avatar.png';

export const TITLE_LOGO_IMAGE = '/generated/title_logo.png';
export const VICTORY_BG_IMAGE = '/generated/bg_victory.png';
export const DEFEAT_BG_IMAGE = '/generated/bg_defeat.png';

export const DODGE_ICON_IMAGE = '/generated/icon_dodge.png';
export const LOCK_ICON_IMAGE = '/generated/icon_lock.png';
export const BAG_ICON_IMAGE = '/generated/icon_bag.png';
export const MEDAL_ICON_IMAGE = '/generated/icon_medal.png';
export const EQUIP_TITLE_ICON_IMAGE = '/generated/icon_equip.png';

// 特效与游戏内图标
export const PROJECTILE_ARROW_IMAGE = '/generated_effects/projectile_arrow.png';
export const PROJECTILE_SPEAR_IMAGE = '/generated_effects/projectile_spear.png';
export const PARTICLE_SPARK_IMAGE = '/generated_effects/particle_spark.png';
export const PARTICLE_SMOKE_IMAGE = '/generated_effects/particle_smoke.png';
export const PARTICLE_BLOOD_IMAGE = '/generated_effects/particle_blood.png';
export const PARTICLE_GOLD_IMAGE = '/generated_effects/particle_gold.png';
export const DROP_CHEST_IMAGE = '/generated_effects/drop_chest.png';
export const HINT_ARROW_IMAGE = '/generated_effects/hint_arrow.png';
export const MINIMAP_PLAYER_IMAGE = '/generated_effects/minimap_player.png';
export const MINIMAP_BOSS_IMAGE = '/generated_effects/minimap_boss.png';
export const MINIMAP_DROP_IMAGE = '/generated_effects/minimap_drop.png';

export const FEATURE_ICON_IMAGES = {
  1: '/generated/feature_ch1.png',
  2: '/generated/feature_ch2.png',
  3: '/generated/feature_ch3.png',
  4: '/generated/feature_ch4.png'
};

export const TAB_ICON_IMAGES = {
  features: '/generated/tab_features.png',
  story: '/generated/tab_story.png',
  controls: '/generated/tab_controls.png'
};

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

export const SKILLS = [
  { name:'普攻', key:'J', icon:'⚔️', cd:0, mp:0, dmgMult:1.0, range:95, arc:Math.PI*0.75, desc:'基础枪术' },
  { name:'枪刃旋风', key:'K', icon:'🌪️', cd:2, mp:15, dmgMult:1.8, range:100, arc:Math.PI*2, desc:'360度旋转攻击' },
  { name:'突刺', key:'L', icon:'🔥', cd:3, mp:20, dmgMult:2.5, range:160, arc:Math.PI/4, desc:'直线突进刺击' },
  { name:'烽火燎原', key:'U', icon:'⚡', cd:8, mp:35, dmgMult:3.5, range:200, arc:Math.PI/3, desc:'大范围火焰伤害' },
  { name:'龙胆枪绝', key:'I', icon:'💫', cd:15, mp:50, dmgMult:5.0, range:250, arc:Math.PI*2, desc:'终极必杀技' }
];

export const ENEMY_TYPES = {
  soldier: { name:'枪兵', color:'#556b2f', radius:28, hp:40, atk:12, def:2, speed:80, exp:15, score:10, dropRate:0.12 },
  archer:  { name:'弓箭手', color:'#8b4513', radius:26, hp:30, atk:16, def:1, speed:60, exp:18, score:15, dropRate:0.15, ranged:true, shootCd:2 },
  cavalry: { name:'骑兵', color:'#4a4a4a', radius:36, hp:80, atk:22, def:5, speed:130, exp:30, score:25, dropRate:0.2 },
  general: { name:'曹将', color:'#8b0000', radius:40, hp:200, atk:30, def:8, speed:100, exp:80, score:60, dropRate:0.5 },
  boss:    { name:'曹操', color:'#4a0080', radius:56, hp:800, atk:35, def:12, speed:90, exp:300, score:200, dropRate:1.0 },
  lubu:    { name:'吕布', color:'#8b0000', radius:64, hp:2000, atk:60, def:20, speed:110, exp:1000, score:1000, dropRate:1.0 },
  dianwei: { name:'典韦', color:'#2a1a10', radius:58, hp:1200, atk:45, def:15, speed:95, exp:400, score:300, dropRate:1.0 },
  xuzhu:   { name:'许褚', color:'#3d2817', radius:60, hp:1500, atk:50, def:18, speed:90, exp:500, score:400, dropRate:1.0 }
};

// 敌人追踪赵云参数：进入范围开始追，超出范围停止追，追击速度比正常慢
export const ENEMY_AGGRO_RANGE = 420;        // 进入此距离开始追击
export const ENEMY_LOSE_AGGRO_RANGE = 650;   // 超出此距离才放弃追击（防止来回抖动）
export const ENEMY_CHASE_SPEED_RATIO = 0.55; // 追击速度倍数（较慢）
export const ENEMY_WANDER_SPEED_RATIO = 0.35; // 游荡速度倍数

export const TERRAIN = [
  { x:300, y:300, r:60 }, { x:800, y:500, r:80 }, { x:1500, y:400, r:100 },
  { x:2200, y:800, r:70 }, { x:2600, y:300, r:90 }, { x:1000, y:1200, r:110 },
  { x:1800, y:1500, r:85 }, { x:500, y:1600, r:75 }, { x:2400, y:1400, r:95 },
  { x:1200, y:700, r:50 }, { x:2000, y:500, r:65 }, { x:700, y:1000, r:55 }
];

export const REWARD_TYPES = [
  { id:'atkUp', icon:'⚔️', name:'锐不可当', desc:'攻击力 +10%', apply: (p) => p.bonusAtk = (p.bonusAtk||0)+0.1 },
  { id:'critUp', icon:'💥', name:'会心一击', desc:'暴击率 +5%', apply: (p) => p.bonusCrit = (p.bonusCrit||0)+5 },
  { id:'spdUp', icon:'👢', name:'疾风步', desc:'移动速度 +10%', apply: (p) => p.bonusSpd = (p.bonusSpd||0)+0.1 },
  { id:'cdDown', icon:'⚡', name:'行云流水', desc:'技能冷却 -8%', apply: (p) => p.bonusCdr = (p.bonusCdr||0)+0.08 },
  { id:'hpUp', icon:'❤️', name:'体魄强健', desc:'最大生命 +15%', apply: (p) => p.bonusHp = (p.bonusHp||0)+0.15 },
  { id:'mpUp', icon:'💧', name:'气定神闲', desc:'法力回复 +30%', apply: (p) => p.bonusMpRegen = (p.bonusMpRegen||0)+0.3 },
  { id:'heal', icon:'🍖', name:'战场急救', desc:'立即恢复 40% 生命', apply: (p) => { p.hp = Math.min(p.hp + p.maxHpTotal*0.4, p.maxHpTotal); } }
];
