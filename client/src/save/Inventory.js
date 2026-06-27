import { QUALITY, ZHAO_YUN_EQUIP_TIERS } from '../config/index.js';

const QUALITY_NAMES = ['普通', '精良', '稀有', '史诗', '传说'];

export class Inventory {
  constructor(data) {
    this._data = data;
  }

  toJSON() {
    return this._data;
  }

  get capacity() { return (this._data && this._data.capacity) || 50; }
  get items() { return (this._data && this._data.items) || []; }
  get count() { return this.items.length; }
  get remaining() { return this.capacity - this.items.length; }
  isFull() { return this.items.length >= this.capacity; }

  addEquip(equip) {
    if (this.isFull()) return -1;
    const index = this._data.items.length;
    this._data.items.push(equip);
    return index;
  }

  addEquips(equips) {
    const added = [];
    for (const eq of equips) {
      const idx = this.addEquip(eq);
      if (idx >= 0) added.push({ index: idx, equip: eq });
    }
    return added;
  }

  getEquip(index) {
    return this._data.items[index] || null;
  }

  removeEquip(index) {
    if (index < 0 || index >= this._data.items.length) return null;
    const [removed] = this._data.items.splice(index, 1);
    return removed;
  }

  findEquipsByType(type) {
    return this._data.items
      .map((eq, index) => ({ eq, index }))
      .filter(({ eq }) => eq.type === type);
  }

  findEquipsByQuality(minQualityIndex) {
    return this._data.items
      .map((eq, index) => ({ eq, index }))
      .filter(({ eq }) => {
        const qIdx = QUALITY_NAMES.indexOf(eq.quality.name);
        return qIdx >= minQualityIndex;
      });
  }

  expandCapacity(amount) {
    this._data.capacity += amount;
  }

  clear() {
    this._data.items = [];
  }

  enhance(index, account) {
    const eq = this.getEquip(index);
    if (!eq) return { ok: false, reason: '装备不存在' };

    const qualityIndex = QUALITY_NAMES.indexOf(eq.quality.name);
    if (qualityIndex < 0) return { ok: false, reason: '无效品质' };

    const tier = eq.tier || 0;
    const level = eq.enhanceLevel || 0;
    const maxLevel = 5 + qualityIndex * 3;
    if (level >= maxLevel) return { ok: false, reason: '已达强化上限' };

    const costCoins = Math.floor((level + 1) * (tier + 1) * 50 * (1 + qualityIndex * 0.2));
    const costStones = Math.floor((level + 1) * (tier + 1) * 5 * (1 + qualityIndex * 0.2));

    if (account.getCurrency('coins') < costCoins) return { ok: false, reason: '铜币不足' };
    if (account.getCurrency('strengtheningStone') < costStones) return { ok: false, reason: '强化石不足' };

    account.consumeCurrency('coins', costCoins);
    account.consumeCurrency('strengtheningStone', costStones);

    const base = ZHAO_YUN_EQUIP_TIERS[tier] && ZHAO_YUN_EQUIP_TIERS[tier][eq.type]
      ? ZHAO_YUN_EQUIP_TIERS[tier][eq.type].stats
      : eq.stats;

    const next = { ...eq.stats };
    const bonusRate = 0.05 * (1 + qualityIndex * 0.1);
    for (const [k, v] of Object.entries(base)) {
      const bonus = Math.max(1, Math.floor(v * bonusRate));
      next[k] = (next[k] || 0) + bonus;
    }

    eq.enhanceLevel = level + 1;
    eq.stats = next;

    return {
      ok: true,
      level: eq.enhanceLevel,
      costCoins,
      costStones,
      stats: eq.stats
    };
  }

  salvage(index) {
    const eq = this.removeEquip(index);
    if (!eq) return null;

    const tier = eq.tier || 0;
    const qualityIndex = QUALITY_NAMES.indexOf(eq.quality?.name) || 0;
    const enhanceLevel = eq.enhanceLevel || 0;

    return {
      coins: Math.floor((tier + 1) * (qualityIndex + 1) * 10 * (1 + enhanceLevel * 0.2)),
      strengtheningStone: Math.floor((tier + 1) * (qualityIndex + 1) * 2 * (1 + enhanceLevel * 0.5)),
      equip: eq
    };
  }
}
