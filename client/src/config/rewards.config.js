export const REWARD_ICON_IMAGES = {
  atkUp: '/generated/stat_atk.png',
  critUp: '/generated/stat_crit.png',
  spdUp: '/generated/stat_spd.png',
  cdDown: '/generated/hud_mp.png',
  hpUp: '/generated/hud_hp.png',
  mpUp: '/generated/hud_mp.png',
  heal: '/generated/hud_hp.png'
};

export const REWARD_TYPES = [
  { id:'atkUp', icon:'⚔️', name:'攻击强化', desc:'攻击力 +10%', apply: (p) => p.bonusAtk = (p.bonusAtk||0)+0.1 },
  { id:'defUp', icon:'🛡️', name:'防御强化', desc:'防御力 +15%', apply: (p) => p.bonusDef = (p.bonusDef||0)+0.15 },
  { id:'critUp', icon:'💥', name:'暴击强化', desc:'暴击率 +5%', apply: (p) => p.bonusCrit = (p.bonusCrit||0)+5 },
  { id:'hpUp', icon:'❤️', name:'生命强化', desc:'最大生命 +15%', apply: (p) => p.bonusHp = (p.bonusHp||0)+0.15 },
  { id:'hpRegenUp', icon:'🍖', name:'恢复强化', desc:'生命恢复 +30%', apply: (p) => p.bonusHpRegen = (p.bonusHpRegen||0)+0.3 },
  { id:'mpRegenUp', icon:'💧', name:'法力强化', desc:'法力回复 +30%', apply: (p) => p.bonusMpRegen = (p.bonusMpRegen||0)+0.3 },
  { id:'godEquip', icon:'👑', name:'随机神装', desc:'获得一件传说装备（Lv.10 后出现）', apply: (p) => {} }
];

// 单局结算奖励公式
export const RUN_REWARD_CONFIG = {
  scoreMultPerKill: 0.02,
  scoreMultPerScore: 0.05,
  coinMultPerKill: 1,
  coinMultPerScore: 0.02,
  soulsOnClear: 10,
  soulsOnFail: 2,
  bossDropCount: 1,
  bossDropQualityBonus: 2,
  initialEquipNames: ['木枪', '布衣', '布巾', '草鞋', '木佩']
};
