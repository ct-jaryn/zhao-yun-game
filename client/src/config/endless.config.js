export const ENDLESS_CONFIG = {
  waveDuration: 45,
  spawnIntervalStart: 1.5,
  spawnIntervalMin: 0.35,
  spawnIntervalDecayPerMinute: 0.08,
  eliteChanceStart: 0.08,
  eliteChanceMax: 0.55,
  eliteChanceGrowthPerMinute: 0.04,
  bossEveryNWaves: 5,
  bossSpawnAtWaveDurationRatio: 0.5,
  maxMinionsBase: 30,
  maxMinionsPerWave: 2,
  groupCountBase: 2,
  groupCountPerWaves: 3,
  groupCountMax: 5,
  spawnTypeWeights: [
    { type: 'soldier', threshold: 0.35 },
    { type: 'archer', threshold: 0.70 },
    { type: 'cavalry', threshold: 1.0 }
  ],
  spawnMargin: 150,
  spawnBand: 200,
  scaling: {
    waveMultBase: 1,
    waveMultPerWave: 0.12,
    timeMultBase: 1,
    timeMultPerMinute: 0.08
  },
  elite: {
    hpMult: 1.5,
    atkMult: 1.3,
    expMult: 1.5,
    scoreMult: 1.5,
    dropRateMult: 1.5,
    prefix: '精英·',
    tint: 0xffaa00
  },
  boss: {
    enhancedHpMult: 1.8,
    enhancedAtkMult: 1.4,
    enhancedDefMult: 1.4,
    enhancedSizeScale: 1.4,
    enhancedHpRegen: 0.08,
    enhancedAtWave: 10,
    skipRevive: true
  }
};

export const ENDLESS_BOSS_POOL = ['boss', 'dianwei', 'xuzhu', 'lubu'];
