export const ENEMY_TYPES = {
  soldier: { name:'枪兵', color:'#556b2f', radius:28, hp:40, atk:12, def:2, speed:80, exp:15, score:10, dropRate:0.12 },
  archer:  { name:'弓箭手', color:'#8b4513', radius:26, hp:30, atk:16, def:1, speed:60, exp:18, score:15, dropRate:0.15, ranged:true, shootCd:2 },
  cavalry: { name:'骑兵', color:'#4a4a4a', radius:36, hp:80, atk:22, def:5, speed:130, exp:30, score:25, dropRate:0.2 },
  general: { name:'曹将', color:'#8b0000', radius:40, hp:200, atk:30, def:8, speed:100, exp:80, score:60, dropRate:0.5 },
  boss:    { name:'曹操', color:'#4a0080', radius:110, hp:800, atk:35, def:12, speed:90, exp:300, score:200, dropRate:1.0 },
  lubu:    { name:'吕布', color:'#8b0000', radius:130, hp:2000, atk:60, def:20, speed:110, exp:1000, score:1000, dropRate:1.0 },
  dianwei: { name:'典韦', color:'#2a1a10', radius:115, hp:1200, atk:45, def:15, speed:95, exp:400, score:300, dropRate:1.0 },
  xuzhu:   { name:'许褚', color:'#3d2817', radius:120, hp:1500, atk:50, def:18, speed:90, exp:500, score:400, dropRate:1.0 }
};

export const BOSS_TYPES = ['boss', 'lubu', 'dianwei', 'xuzhu'];
export const MINION_TYPES = ['soldier', 'archer', 'cavalry'];
export const ELITE_TYPES = ['general'];

export function isBossType(type) { return BOSS_TYPES.includes(type); }
export function isMinionType(type) { return MINION_TYPES.includes(type); }
export function isEliteType(type) { return ELITE_TYPES.includes(type); }

// 敌人追踪赵云参数：进入范围开始追，超出范围停止追，追击速度比正常慢
export const ENEMY_AGGRO_RANGE = 420;        // 进入此距离开始追击
export const ENEMY_LOSE_AGGRO_RANGE = 650;   // 超出此距离才放弃追击（防止来回抖动）
export const ENEMY_CHASE_SPEED_RATIO = 0.55; // 追击速度倍数（较慢）
export const ENEMY_WANDER_SPEED_RATIO = 0.35; // 游荡速度倍数

// 敌人战斗通用配置
export const ENEMY_COMBAT_CONFIG = {
  levelScaling: {
    hp: 0.25,
    atk: 0.25,
    def: 0.25,
    exp: 0.25
  },
  boss: {
    hpRegen: 0.05,
    lubuHpRegen: 0.05,
    deathFadeDuration: 0.6,
    reviveTimer: 60,
    reviveHpMult: 2,
    reviveAtkMult: 2,
    reviveDefMult: 2,
    enrageHpThreshold: 0.5,
    enrageSizeScale: 1.5
  },
  enhanced: {
    hpMult: 1.8,
    atkMult: 1.4,
    defMult: 1.4,
    sizeScale: 1.4,
    hpRegen: 0.08
  },
  knockback: {
    duration: 0.12,
    speed: 120
  },
  attack: {
    baseCd: 1.0,
    skillCd: 1.5,
    skillAnimTimer: 0.7,
    baseAnimTimer: 0.5,
    ultimateChance: 0.1,
    ultimateCd: 3.0,
    ultimateAnimTimer: 0.9,
    ultimateDamageMult: 1.5,
    skillDamageMult: 1.3,
    rangedFleeDistance: 150,
    rangedProjectileSpeed: 260,
    rangedProjectileSize: 6,
    rangedProjectileLife: 2.5,
    rangedAimJitter: 0.15,
    shootTimerMin: 0.5,
    shootTimerMax: 2
  },
  state: {
    wanderTimerMin: 0.5,
    wanderTimerMax: 1.5,
    idleTimerMin: 1,
    idleTimerMax: 3,
    idleChance: 0.3
  },
  hpBar: {
    width: 60,
    height: 6,
    yOffset: -15,
    nameYOffset: -28,
    fontSize: 12
  },
  tints: {
    boss: 0xff00ff,
    general: 0xff4444,
    default: 0x88ff88,
    hitFlash: 0xffffff,
    charmed: 0xff69b4,
    elite: 0xffaa00
  }
};
