import { QUALITY, ZHAO_YUN_EQUIP_TIERS, EQUIP_STAT_LABELS, EQUIPMENT_ECONOMY } from '../config/index.js';

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
    const cfg = EQUIPMENT_ECONOMY.enhance;
    const maxLevel = cfg.maxLevelBase + qualityIndex * cfg.maxLevelPerQuality;
    if (level >= maxLevel) return { ok: false, reason: '已达强化上限' };

    const tierFactor = (level + 1) * (this._tier(eq) + 1);
    const qualityFactor = 1 + qualityIndex * cfg.costQualityMult;
    const costCoins = Math.floor(tierFactor * cfg.costCoinBase * qualityFactor);
    const costStones = Math.floor(tierFactor * cfg.costStoneBase * qualityFactor);

    if (account.getCurrency('coins') < costCoins) return { ok: false, reason: '铜币不足' };
    if (account.getCurrency('strengtheningStone') < costStones) return { ok: false, reason: '强化石不足' };

    account.consumeCurrency('coins', costCoins);
    account.consumeCurrency('strengtheningStone', costStones);

    const base = this._baseFromTier(eq);
    const bonusRate = cfg.bonusRateBase * (1 + qualityIndex * cfg.bonusRateQualityMult);
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
    const cfg = EQUIPMENT_ECONOMY.refine;
    const maxLevel = cfg.maxLevelBase + qualityIndex * cfg.maxLevelPerQuality;
    if (level >= maxLevel) return { ok: false, reason: '已达精炼上限' };

    const tierFactor = (level + 1) * (this._tier(eq) + 1);
    const qualityFactor = 1 + qualityIndex * cfg.costQualityMult;
    const costCoins = Math.floor(tierFactor * cfg.costCoinBase * qualityFactor);
    const costRefineStone = Math.floor(tierFactor * cfg.costStoneBase * qualityFactor);

    if (account.getCurrency('coins') < costCoins) return { ok: false, reason: '铜币不足' };
    if (account.getCurrency('refineStone') < costRefineStone) return { ok: false, reason: '精炼石不足' };

    account.consumeCurrency('coins', costCoins);
    account.consumeCurrency('refineStone', costRefineStone);

    const base = this._baseFromTier(eq);
    const bonusRate = cfg.bonusRateBase * (1 + qualityIndex * cfg.bonusRateQualityMult);
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
    const cfg = EQUIPMENT_ECONOMY.wash;
    const tierFactor = this._tier(eq) + 1;
    const qualityFactor = 1 + qualityIndex * cfg.costQualityMult;
    const stoneQualityFactor = 1 + qualityIndex * cfg.costStoneQualityMult;
    const costCoins = Math.floor(tierFactor * cfg.costCoinBase * qualityFactor);
    const costRefineStone = Math.floor(tierFactor * cfg.costStoneBase * stoneQualityFactor);

    if (account.getCurrency('coins') < costCoins) return { ok: false, reason: '铜币不足' };
    if (account.getCurrency('refineStone') < costRefineStone) return { ok: false, reason: '精炼石不足' };

    account.consumeCurrency('coins', costCoins);
    account.consumeCurrency('refineStone', costRefineStone);

    const statPool = Object.keys(EQUIP_STAT_LABELS);
    const rollCount = cfg.rollCountBase + Math.floor(Math.random() * Math.min(cfg.rollCountMaxBonus, qualityIndex + 1));
    const base = this._baseFromTier(eq);
    const baseAvg = Object.values(base).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(base).length);
    const washed = {};
    for (let i = 0; i < rollCount; i++) {
      const stat = statPool[Math.floor(Math.random() * statPool.length)];
      const sign = Math.random() < cfg.positiveRate ? 1 : -1;
      const value = Math.max(1, Math.floor(baseAvg * (cfg.valueMinRate + Math.random() * (cfg.valueMaxRate - cfg.valueMinRate)) * (1 + qualityIndex * cfg.valueQualityMult))) * sign;
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

    const qualityIndex = this._qualityIndex(eq);
    const cfg = EQUIPMENT_ECONOMY.gem;
    const maxSockets = cfg.socketBase + Math.floor(qualityIndex * cfg.socketPerQuality);
    if ((eq.gemSockets || []).length >= maxSockets) return { ok: false, reason: '镶嵌孔已满' };

    const gemIndex = account.gemItems.indexOf(gem);
    if (gemIndex < 0) return { ok: false, reason: '背包中没有该宝石' };

    account.removeGem(gemIndex);
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
    const cfg = EQUIPMENT_ECONOMY.salvage;
    const tierQualityFactor = (tier + 1) * (qualityIndex + 1);

    return {
      coins: Math.floor(tierQualityFactor * cfg.coinBase * (1 + enhanceLevel * cfg.enhanceLevelMult + refineLevel * cfg.refineLevelMult)),
      strengtheningStone: Math.floor(tierQualityFactor * cfg.stoneBase * (1 + enhanceLevel * cfg.enhanceStoneMult)),
      refineStone: Math.floor(tierQualityFactor * cfg.refineStoneBase * Math.max(0, refineLevel * cfg.refineStoneMult)),
      equip: eq
    };
  }
}
