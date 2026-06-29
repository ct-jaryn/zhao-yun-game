import { EQUIP_TYPES } from '../config/index.js';

export const SAVE_VERSION = 1;

export function createDefaultHero(id) {
  return {
    id,
    level: 1,
    exp: 0,
    stars: 0,
    skin: 'classic',
    equipment: createEmptyEquipment(),
    talentNodes: [],
    skillLevels: [1, 1, 1, 1, 1],
    skillBranchSelections: {},
    records: {
      highestChapter: 0,
      highestDifficulty: 'normal',
      totalKills: 0,
      totalScore: 0,
      bestCombo: 0,
      playCount: 0
    }
  };
}

export function createEmptyEquipment() {
  const equip = {};
  for (const type of EQUIP_TYPES) {
    equip[type] = null;
  }
  return equip;
}

export function createDefaultAccount() {
  return {
    rank: 1,
    rankExp: 0,
    currencies: {
      coins: 0,
      souls: 0,
      merit: 0,
      gems: 0,
      strengtheningStone: 0,
      refineStone: 0
    },
    unlockedHeroes: ['zhaoyun'],
    unlockedChapters: [1],
    unlockedSkins: {
      zhaoyun: ['classic']
    },
    daily: {
      lastResetDate: '',
      challengeCompletions: 0,
      claimedRewards: [],
      shopDate: '',
      shopStock: [],
      shopRefreshCount: 0
    },
    gems: []
  };
}

export function createDefaultInventory() {
  return {
    capacity: 50,
    items: []
  };
}

export function createDefaultProgression() {
  return {
    achievements: [],
    codex: {
      weapons: [],
      armors: [],
      helmets: [],
      boots: [],
      accessories: [],
      sets: {}
    },
    clears: [],
    endless: {
      bestTime: 0,
      bestKills: 0,
      bestWave: 0
    }
  };
}

export function createDefaultSettings() {
  return {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    language: 'zh-CN',
    screenShake: true,
    showDamageNumbers: true,
    cloudToken: ''
  };
}

export function createDefaultSave() {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    account: createDefaultAccount(),
    heroes: {
      zhaoyun: createDefaultHero('zhaoyun')
    },
    inventory: createDefaultInventory(),
    progression: createDefaultProgression(),
    settings: createDefaultSettings()
  };
}
