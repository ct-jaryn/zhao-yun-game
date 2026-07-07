export const CHAPTER_CONFIG = {
  1: {
    name: '虎牢救美',
    subtitle: '单骑救貂蝉',
    enemyLevelBonus: 0,
    maxMinions: 25,
    tint: null,
    bossType: 'lubu',
    bossName: '吕布',
    finalBosses: [{ type: 'lubu', enhanced: true, name: '吕布·狂暴' }],
    victoryText: '通关！吕布败退，貂蝉得救！',
    victorySubtitle: '貂蝉已被安全救出'
  },
  2: {
    name: '血战宛城',
    subtitle: '古之恶来',
    enemyLevelBonus: 1,
    maxMinions: 30,
    tint: null,
    bossType: 'dianwei',
    bossName: '典韦',
    finalBosses: [
      { type: 'boss', enhanced: true, name: '曹操·狂暴' },
      { type: 'dianwei', name: '典韦' }
    ],
    victoryText: '通关！典韦与曹操皆已被击败！',
    victorySubtitle: '古之恶来陨落，铁戟染血，宛城之路已开！'
  },
  3: {
    name: '渭水怒涛',
    subtitle: '虎痴之锤',
    enemyLevelBonus: 2,
    maxMinions: 32,
    tint: 'rgba(20,20,40,0.25)',
    bossType: 'xuzhu',
    bossName: '许褚',
    finalBosses: [
      { type: 'boss', enhanced: true, name: '曹操·狂暴' },
      { type: 'xuzhu', name: '许褚' }
    ],
    victoryText: '通关！许褚与曹操皆已被击败！',
    victorySubtitle: '虎痴倒下，巨锤沉江，渭水为之呜咽！'
  },
  4: {
    name: '下邳焚天',
    subtitle: '无双吕布',
    enemyLevelBonus: 3,
    maxMinions: 35,
    tint: 'rgba(60,15,10,0.28)',
    bossType: 'lubu',
    bossName: '吕布',
    finalBosses: [
      { type: 'boss', enhanced: true, name: '曹操·狂暴' },
      { type: 'lubu', name: '吕布' }
    ],
    victoryText: '通关！吕布与曹操皆已被击败！',
    victorySubtitle: '无双吕布败退，方天画戟折锋，天下谁还敢挡！'
  }
};
