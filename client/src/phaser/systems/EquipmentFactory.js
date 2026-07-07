import { EQUIP_TYPES, QUALITY, ZHAO_YUN_EQUIP_TIERS } from '../../config/index.js';
import { pick } from '../utils/index.js';

export function getEquipTier(level) {
  const weights = [
    Math.max(0.10, 0.60 - level * 0.03),
    Math.min(0.45, 0.25 + level * 0.01),
    Math.min(0.35, 0.08 + level * 0.015),
    Math.min(0.30, 0.04 + level * 0.015),
    Math.min(0.45, 0.01 + level * 0.02)
  ];
  const total = weights.reduce((a, b) => a + b, 0);
  const roll = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) return i;
  }
  return 0;
}

export function genEquip(level) {
  const type = pick(EQUIP_TYPES);
  const tier = getEquipTier(level);
  const tierData = ZHAO_YUN_EQUIP_TIERS[tier][type];

  const qRoll = Math.random();
  let qi = 0;
  const goldRate = Math.min(0.25, 0.02 + level * 0.008);
  const purpleRate = Math.min(0.45, 0.08 + level * 0.015);
  const blueRate = Math.min(0.7, 0.25 + level * 0.02);
  const greenRate = Math.min(0.9, 0.55 + level * 0.015);
  if (qRoll < goldRate) qi = 4;
  else if (qRoll < purpleRate) qi = 3;
  else if (qRoll < blueRate) qi = 2;
  else if (qRoll < greenRate) qi = 1;
  const q = QUALITY[qi];

  const stats = {};
  for (const [k, v] of Object.entries(tierData.stats)) {
    stats[k] = Math.floor(v * q.mult * (0.85 + Math.random() * 0.3));
  }
  return { type, name: tierData.name, quality: q, stats, baseStats: { ...stats }, level, tier };
}

export function createInitialEquip() {
  const equip = {};
  const tierData = ZHAO_YUN_EQUIP_TIERS[0];
  for (const type of EQUIP_TYPES) {
    const stats = {};
    for (const [k, v] of Object.entries(tierData[type].stats)) {
      stats[k] = Math.floor(v * QUALITY[0].mult);
    }
    equip[type] = { type, name: tierData[type].name, quality: QUALITY[0], stats, baseStats: { ...stats }, level: 1, tier: 0 };
  }
  return equip;
}

export function equipStatText(eq) {
  const labels = { atk:'攻击', def:'防御', hp:'生命', mp:'法力', crit:'暴击', spd:'速度' };
  return Object.entries(eq.stats).map(([k, v]) => `${labels[k] || k}+${v}`).join(' ');
}

export function equipPower(eq) {
  let v = 0;
  for (const k in eq.stats) v += eq.stats[k];
  return v * eq.quality.mult;
}

export class EquipmentFactory {
  static genEquip(level) { return genEquip(level); }
  static createInitialEquip() { return createInitialEquip(); }
  static statText(eq) { return equipStatText(eq); }
  static power(eq) { return equipPower(eq); }
}
