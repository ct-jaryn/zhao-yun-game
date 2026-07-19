export const CHAPTER_CONFIG = {
  1: {
    name: '虎牢救美',
    subtitle: '单骑救貂蝉',
    enemyLevelBonus: 0,
    soldiersRequired: 20,
    maxMinions: 25,
    tint: null,
    bossType: 'lubu',
    bossName: '吕布',
    bossLevel: 4,
    finalBosses: [],
    victoryCondition: 'rescue',
    victoryText: '通关！吕布败退，貂蝉得救！',
    victorySubtitle: '貂蝉已被安全救出'
  },
  2: {
    name: '血战宛城',
    subtitle: '古之恶来',
    enemyLevelBonus: 1,
    soldiersRequired: 22,
    maxMinions: 30,
    tint: null,
    bossType: 'dianwei',
    bossName: '典韦',
    bossLevel: 5,
    finalBosses: [
      { type: 'boss', level: 5, enhanced: true, name: '曹操·狂暴' },
      { type: 'dianwei', level: 5, name: '典韦' }
    ],
    victoryCondition: 'defeat_final_bosses',
    victoryText: '通关！典韦与曹操皆已被击败！',
    victorySubtitle: '古之恶来陨落，铁戟染血，宛城之路已开！'
  },
  3: {
    name: '渭水怒涛',
    subtitle: '虎痴之锤',
    enemyLevelBonus: 2,
    soldiersRequired: 24,
    maxMinions: 32,
    tint: 'rgba(20,20,40,0.25)',
    bossType: 'xuzhu',
    bossName: '许褚',
    bossLevel: 6,
    finalBosses: [
      { type: 'boss', level: 6, enhanced: true, name: '曹操·狂暴' },
      { type: 'xuzhu', level: 6, name: '许褚' }
    ],
    victoryCondition: 'defeat_final_bosses',
    victoryText: '通关！许褚与曹操皆已被击败！',
    victorySubtitle: '虎痴倒下，巨锤沉江，渭水为之呜咽！'
  },
  4: {
    name: '下邳焚天',
    subtitle: '无双吕布',
    enemyLevelBonus: 3,
    soldiersRequired: 26,
    maxMinions: 35,
    tint: 'rgba(60,15,10,0.28)',
    bossType: 'lubu',
    bossName: '吕布',
    bossLevel: 7,
    finalBosses: [
      { type: 'boss', level: 7, enhanced: true, name: '曹操·狂暴' },
      { type: 'lubu', level: 7, name: '吕布' }
    ],
    victoryCondition: 'defeat_final_bosses',
    victoryText: '通关！吕布与曹操皆已被击败！',
    victorySubtitle: '无双吕布败退，方天画戟折锋，天下谁还敢挡！'
  }
};
