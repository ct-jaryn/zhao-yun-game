export const SKILLS = [
  { name:'普攻', key:'J', icon:'⚔️', cd:0, mp:0, dmgMult:1.0, range:95, arc:Math.PI*0.75, desc:'基础枪术' },
  { name:'枪刃旋风', key:'K', icon:'🌪️', cd:2, mp:15, dmgMult:1.8, range:100, arc:Math.PI*2, desc:'360度旋转攻击' },
  { name:'突刺', key:'L', icon:'🔥', cd:3, mp:20, dmgMult:2.5, range:160, arc:Math.PI/4, desc:'直线突进刺击' },
  { name:'烽火燎原', key:'U', icon:'⚡', cd:8, mp:35, dmgMult:3.5, range:200, arc:Math.PI/3, desc:'大范围火焰伤害' },
  { name:'龙胆枪绝', key:'I', icon:'💫', cd:15, mp:50, dmgMult:5.0, range:250, arc:Math.PI*2, desc:'终极必杀技' }
];

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
