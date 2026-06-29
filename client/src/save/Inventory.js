import { QUALITY, ZHAO_YUN_EQUIP_TIERS, EQUIP_STAT_LABELS } from '../config/index.js';

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

  expandCapacity(amount) {
    if (!this._data) return;
    this._data.capacity = (this._data.capacity || 50) + amount;
    return this._data.capacity;
  }

  addEquip(equip) {
    if (this.isFull()) return -1;
    this._migrateEquip(equip);
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
    const eq = this._data.items[index] || null;
    if (eq) this._migrateEquip(eq);
    return eq;
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

  clear() {
    this._data.items = [];
  }

  _migrateEquip(eq) {
    if (!eq) return;
    if (!eq.baseStats) eq.baseStats = { ...eq.stats };
    if (!eq.enhanceStats) {
      eq.enhanceStats = {};
      // 兼容旧版：将已有强化收益提取出来
      if ((eq.enhanceLevel || 0) > 0) {
        for (const [k, v] of Object.entries(eq.baseStats)) {
          const diff = (eq.stats[k] || 0) - v;
          if (diff > 0) eq.enhanceStats[k] = diff;
        }
      }
    }
    if (!eq.refineStats) eq.refineStats = {};
    if (!eq.washStats) eq.washStats = {};
    if (!eq.gemStats) eq.gemStats = {};
    if (!Array.isArray(eq.gemSockets)) eq.gemSockets = [];
    this._rebuildStats(eq);
  }

  _rebuildStats(eq) {
    const stats = {};
    const addLayer = (layer) => {
      for (const [k, v] of Object.entries(layer || {})) {
        if (v) stats[k] = (stats[k] || 0) + v;
      }
    };
    addLayer(eq.baseStats);
    addLayer(eq.enhanceStats);
    addLayer(eq.refineStats);
    addLayer(eq.washStats);
    addLayer(eq.gemStats);
    eq.stats = stats;
  }

  _qualityIndex(eq) {
    return Math.max(0, QUALITY_NAMES.indexOf(eq.quality?.name));
  }

  _tier(eq) {
    return eq.tier || 0;
  }

  _baseFromTier(eq) {
    const tier = this._tier(eq);
    const tierData = ZHAO_YUN_EQUIP_TIERS[tier] && ZHAO_YUN_EQUIP_TIERS[tier][eq.type];
    return tierData ? tierData.stats : (eq.baseStats || eq.stats);
  }

  enhance(index, account) {
    const eq = this.getEquip(index);
    if (!eq) return { ok: false, reason: '装备不存在' };

    const qualityIndex = this._qualityIndex(eq);
    const level = eq.enhanceLevel || 0;
    const maxLevel = 5 + qualityIndex * 3;
    if (level >= maxLevel) return { ok: false, reason: '已达强化上限' };

    const costCoins = Math.floor((level + 1) * (this._tier(eq) + 1) * 50 * (1 + qualityIndex * 0.2));
    const costStones = Math.floor((level + 1) * (this._tier(eq) + 1) * 5 * (1 + qualityIndex * 0.2));

    if (account.getCurrency('coins') < costCoins) return { ok: false, reason: '铜币不足' };
    if (account.getCurrency('strengtheningStone') < costStones) return { ok: false, reason: '强化石不足' };

    account.consumeCurrency('coins', costCoins);
    account.consumeCurrency('strengtheningStone', costStones);

    const base = this._baseFromTier(eq);
    const bonusRate = 0.05 * (1 + qualityIndex * 0.1);
    for (const [k, v] of Object.entries(base)) {
      const bonus = Math.max(1, Math.floor(v * bonusRate));
      eq.enhanceStats[k] = (eq.enhanceStats[k] || 0) + bonus;
    }
    eq.enhanceLevel = level + 1;
    this._rebuildStats(eq);

    return {
      ok: true,
      level: eq.enhanceLevel,
      costCoins,
      costStones,
      stats: eq.stats
    };
  }

  refine(index, account) {
    const eq = this.getEquip(index);
    if (!eq) return { ok: false, reason: '装备不存在' };

    const qualityIndex = this._qualityIndex(eq);
    const level = eq.refineLevel || 0;
    const maxLevel = 3 + qualityIndex * 2;
    if (level >= maxLevel) return { ok: false, reason: '已达精炼上限' };

    const costCoins = Math.floor((level + 1) * (this._tier(eq) + 1) * 80 * (1 + qualityIndex * 0.3));
    const costRefineStone = Math.floor((level + 1) * (this._tier(eq) + 1) * 3 * (1 + qualityIndex * 0.3));

    if (account.getCurrency('coins') < costCoins) return { ok: false, reason: '铜币不足' };
    if (account.getCurrency('refineStone') < costRefineStone) return { ok: false, reason: '精炼石不足' };

    account.consumeCurrency('coins', costCoins);
    account.consumeCurrency('refineStone', costRefineStone);

    const base = this._baseFromTier(eq);
    const bonusRate = 0.04 * (1 + qualityIndex * 0.15);
    for (const [k, v] of Object.entries(base)) {
      const bonus = Math.max(1, Math.floor(v * bonusRate));
      eq.refineStats[k] = (eq.refineStats[k] || 0) + bonus;
    }
    eq.refineLevel = level + 1;
    this._rebuildStats(eq);

    return {
      ok: true,
      level: eq.refineLevel,
      costCoins,
      costRefineStone,
      stats: eq.stats
    };
  }

  wash(index, account) {
    const eq = this.getEquip(index);
    if (!eq) return { ok: false, reason: '装备不存在' };

    const qualityIndex = this._qualityIndex(eq);
    const costCoins = Math.floor((this._tier(eq) + 1) * 200 * (1 + qualityIndex * 0.4));
    const costRefineStone = Math.floor((this._tier(eq) + 1) * 2 * (1 + qualityIndex * 0.2));

    if (account.getCurrency('coins') < costCoins) return { ok: false, reason: '铜币不足' };
    if (account.getCurrency('refineStone') < costRefineStone) return { ok: false, reason: '精炼石不足' };

    account.consumeCurrency('coins', costCoins);
    account.consumeCurrency('refineStone', costRefineStone);

    const statPool = Object.keys(EQUIP_STAT_LABELS);
    const rollCount = 1 + Math.floor(Math.random() * Math.min(3, qualityIndex + 1));
    const base = this._baseFromTier(eq);
    const baseAvg = Object.values(base).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(base).length);
    const washed = {};
    for (let i = 0; i < rollCount; i++) {
      const stat = statPool[Math.floor(Math.random() * statPool.length)];
      const sign = Math.random() < 0.85 ? 1 : -1;
      const value = Math.max(1, Math.floor(baseAvg * (0.2 + Math.random() * 0.5) * (1 + qualityIndex * 0.2))) * sign;
      washed[stat] = (washed[stat] || 0) + value;
    }
    eq.washStats = washed;
    eq.washCount = (eq.washCount || 0) + 1;
    this._rebuildStats(eq);

    return {
      ok: true,
      washCount: eq.washCount,
      washStats: eq.washStats,
      costCoins,
      costRefineStone,
      stats: eq.stats
    };
  }

  inlayGem(index, gem, account) {
    const eq = this.getEquip(index);
    if (!eq) return { ok: false, reason: '装备不存在' };
    if (!gem) return { ok: false, reason: '宝石不存在' };

    const maxSockets = 1 + Math.floor(this._qualityIndex(eq) / 2);
    if ((eq.gemSockets || []).length >= maxSockets) return { ok: false, reason: '镶嵌孔已满' };

    const gemIndex = account.gems.indexOf(gem);
    if (gemIndex < 0) return { ok: false, reason: '背包中没有该宝石' };

    account.gems.splice(gemIndex, 1);
    eq.gemSockets.push(gem);
    eq.gemStats[gem.stat] = (eq.gemStats[gem.stat] || 0) + gem.value;
    this._rebuildStats(eq);

    return { ok: true, gem, stats: eq.stats };
  }

  salvage(index) {
    const eq = this.removeEquip(index);
    if (!eq) return null;

    const tier = this._tier(eq);
    const qualityIndex = this._qualityIndex(eq);
    const enhanceLevel = eq.enhanceLevel || 0;
    const refineLevel = eq.refineLevel || 0;

    return {
      coins: Math.floor((tier + 1) * (qualityIndex + 1) * 10 * (1 + enhanceLevel * 0.2 + refineLevel * 0.3)),
      strengtheningStone: Math.floor((tier + 1) * (qualityIndex + 1) * 2 * (1 + enhanceLevel * 0.5)),
      refineStone: Math.floor((tier + 1) * (qualityIndex + 1) * (refineLevel * 0.5)),
      equip: eq
    };
  }
}
