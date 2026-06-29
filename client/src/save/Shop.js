import {
  SHOP_ITEMS,
  SHOP_REFRESH_COST,
  SHOP_DAILY_SLOTS,
  generateShopStock,
  generateCrateEquip
} from '../config/index.js';

export class Shop {
  constructor(saveManager) {
    this.save = saveManager;
    this._ensureDailyFields();
  }

  _ensureDailyFields() {
    const daily = this.save.account._data.daily;
    if (!daily.shopStock) daily.shopStock = [];
    if (typeof daily.shopRefreshCount !== 'number') daily.shopRefreshCount = 0;
    if (!daily.shopDate) daily.shopDate = '';
  }

  _todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  _getSeed(extra = 0) {
    const date = this._todayStr();
    return date.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), extra + 1);
  }

  resetIfNeeded() {
    const today = this._todayStr();
    const daily = this.save.account._data.daily;
    this._ensureDailyFields();
    if (daily.shopDate !== today) {
      daily.shopDate = today;
      daily.shopRefreshCount = 0;
      const seed = this._getSeed();
      daily.shopStock = generateShopStock(seed, SHOP_DAILY_SLOTS);
      this.save.persist();
      return true;
    }
    if (!daily.shopStock || daily.shopStock.length === 0) {
      const seed = this._getSeed();
      daily.shopStock = generateShopStock(seed, SHOP_DAILY_SLOTS);
      this.save.persist();
      return true;
    }
    return false;
  }

  getStock() {
    this.resetIfNeeded();
    return this.save.account._data.daily.shopStock;
  }

  canRefresh() {
    this.resetIfNeeded();
    return this.save.account.getCurrency('gems') >= SHOP_REFRESH_COST;
  }

  refreshStock() {
    this.resetIfNeeded();
    const account = this.save.account;
    if (!account.consumeCurrency('gems', SHOP_REFRESH_COST)) {
      return { ok: false, reason: '元宝不足' };
    }
    const daily = account._data.daily;
    daily.shopRefreshCount++;
    const seed = this._getSeed(daily.shopRefreshCount * 1000);
    daily.shopStock = generateShopStock(seed, SHOP_DAILY_SLOTS);
    this.save.persist();
    return { ok: true, stock: daily.shopStock, cost: SHOP_REFRESH_COST };
  }

  buy(instanceId) {
    this.resetIfNeeded();
    const stock = this.save.account._data.daily.shopStock;
    const slot = stock.find(s => s.instanceId === instanceId);
    if (!slot) return { ok: false, reason: '商品不存在' };
    if (slot.sold) return { ok: false, reason: '商品已售罄' };

    const item = SHOP_ITEMS.find(i => i.id === slot.itemId);
    if (!item) return { ok: false, reason: '商品配置错误' };

    const account = this.save.account;
    if (!account.consumeCurrency(item.cost.type, item.cost.amount)) {
      return { ok: false, reason: `${this._currencyName(item.cost.type)}不足` };
    }

    const effectResult = this._applyEffect(item.effect);
    if (!effectResult.ok) {
      account.addCurrency(item.cost.type, item.cost.amount);
      return effectResult;
    }

    slot.sold = true;
    this.save.persist();
    return { ok: true, item, effectResult };
  }

  _applyEffect(effect) {
    const account = this.save.account;
    const inventory = this.save.inventory;
    switch (effect.type) {
      case 'currency':
        account.addCurrency(effect.currency, effect.amount);
        return { ok: true, type: 'currency', currency: effect.currency, amount: effect.amount };
      case 'inventoryExpand':
        inventory.expandCapacity(effect.amount);
        return { ok: true, type: 'inventoryExpand', amount: effect.amount };
      case 'equipCrate': {
        if (inventory.isFull()) {
          return { ok: false, reason: '背包已满' };
        }
        const seed = Date.now();
        const equip = generateCrateEquip(seed, effect.minQuality, effect.maxQuality, effect.tier);
        const index = inventory.addEquip(equip);
        if (index < 0) return { ok: false, reason: '背包已满' };
        this.save.progression.discoverEquip(equip);
        return { ok: true, type: 'equip', equip, index };
      }
      default:
        return { ok: false, reason: '未知商品效果' };
    }
  }

  _currencyName(type) {
    const names = {
      coins: '铜币',
      souls: '将魂',
      gems: '元宝',
      merit: '战功',
      strengtheningStone: '强化石',
      refineStone: '精炼石'
    };
    return names[type] || type;
  }
}
