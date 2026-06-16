export const W = 1000;
export const H = 700;
export const MAP_W = 3000;
export const MAP_H = 2000;
export const ASPECT = W / H;

export const EQUIP_TYPES = ['武器', '铠甲', '头盔', '靴子', '饰品'];
export const EQUIP_NAMES = {
  '武器': ['青釭剑','丈八蛇矛','方天画戟','龙胆枪','倚天剑','古锭刀','七星刀','雌雄双股剑'],
  '铠甲': ['锁子甲','明光铠','鱼鳞甲','山文甲','百花战袍','兽面吞头铠'],
  '头盔': ['铁兜鍪','凤翅金盔','束发金冠','紫金冠','狮子盔'],
  '靴子': ['飞云靴','追风靴','踏雪靴','疾风靴','腾云靴'],
  '饰品': ['玉佩','护心镜','赤兔铃','龙纹璧','虎符']
};
export const EQUIP_ICONS = { '武器':'⚔️', '铠甲':'🛡️', '头盔':'⛑️', '靴子':'👢', '饰品':'💎' };
export const EQUIP_STAT_LABELS = { atk:'攻击', def:'防御', hp:'生命', mp:'法力', crit:'暴击', spd:'速度' };

export const QUALITY = [
  { name:'普通', color:'#999', mult:1 },
  { name:'精良', color:'#44ff44', mult:1.3 },
  { name:'稀有', color:'#4488ff', mult:1.6 },
  { name:'史诗', color:'#aa44ff', mult:2.0 },
  { name:'传说', color:'#ffd700', mult:2.5 }
];

export const SKILLS = [
  { name:'普攻', key:'J', icon:'⚔️', cd:0, mp:0, dmgMult:1.0, range:95, arc:Math.PI*0.75, desc:'基础枪术' },
  { name:'枪刃旋风', key:'K', icon:'🌪️', cd:2, mp:15, dmgMult:1.8, range:100, arc:Math.PI*2, desc:'360度旋转攻击' },
  { name:'突刺', key:'L', icon:'🔥', cd:3, mp:20, dmgMult:2.5, range:160, arc:Math.PI/4, desc:'直线突进刺击' },
  { name:'烽火燎原', key:'U', icon:'⚡', cd:8, mp:35, dmgMult:3.5, range:200, arc:Math.PI/3, desc:'大范围火焰伤害' },
  { name:'龙胆枪绝', key:'I', icon:'💫', cd:15, mp:50, dmgMult:5.0, range:250, arc:Math.PI*2, desc:'终极必杀技' }
];

export const ENEMY_TYPES = {
  soldier: { name:'枪兵', color:'#556b2f', radius:28, hp:40, atk:8, def:2, speed:80, exp:15, score:10, dropRate:0.12 },
  archer:  { name:'弓箭手', color:'#8b4513', radius:26, hp:30, atk:12, def:1, speed:60, exp:18, score:15, dropRate:0.15, ranged:true, shootCd:2 },
  cavalry: { name:'骑兵', color:'#4a4a4a', radius:36, hp:80, atk:15, def:5, speed:130, exp:30, score:25, dropRate:0.2 },
  general: { name:'曹将', color:'#8b0000', radius:40, hp:200, atk:22, def:8, speed:100, exp:80, score:60, dropRate:0.5 },
  boss:    { name:'曹操', color:'#4a0080', radius:56, hp:800, atk:35, def:12, speed:90, exp:300, score:200, dropRate:1.0 }
};

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
