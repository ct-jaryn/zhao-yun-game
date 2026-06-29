import { Shop } from '../src/save/Shop.js';
import { Inventory } from '../src/save/Inventory.js';
import { Account } from '../src/save/Account.js';
import { Progression } from '../src/save/Progression.js';
import { HeroCollection } from '../src/save/HeroCollection.js';
import { createDefaultSave } from '../src/save/schemas.js';

function makeSaveManager() {
  const raw = createDefaultSave();
  return {
    _raw: raw,
    account: new Account(raw.account),
    inventory: new Inventory(raw.inventory),
    progression: new Progression(raw.progression),
    heroes: new HeroCollection(raw.heroes),
    persist() {}
  };
}

function run() {
  const save = makeSaveManager();
  save.account.addCurrency('gems', 1000);
  save.account.addCurrency('merit', 1000);
  save.account.addCurrency('coins', 10000);

  const shop = new Shop(save);
  const stock = shop.getStock();
  if (stock.length !== 6) throw new Error(`商店初始商品数量应为 6，实际 ${stock.length}`);

  // 购买材料
  const slot = stock.find(s => s.itemId === 'coins_small');
  if (slot) {
    const before = save.account.getCurrency('coins');
    const result = shop.buy(slot.instanceId);
    if (!result.ok) throw new Error('购买铜币袋应成功: ' + result.reason);
    if (save.account.getCurrency('coins') !== before + 500) throw new Error('购买铜币袋后货币未正确增加');
    if (!slot.sold) throw new Error('购买后商品应标记为已售');
  }

  // 购买背包扩展
  const expandSlot = stock.find(s => s.itemId === 'inventory_expand');
  if (expandSlot) {
    const before = save.inventory.capacity;
    const result = shop.buy(expandSlot.instanceId);
    if (!result.ok) throw new Error('购买背包扩展应成功: ' + result.reason);
    if (save.inventory.capacity !== before + 10) throw new Error('背包扩展后容量未增加');
  }

  // 购买装备箱
  const crateSlot = stock.find(s => s.itemId && s.itemId.startsWith('equip_crate'));
  if (crateSlot) {
    const countBefore = save.inventory.count;
    const result = shop.buy(crateSlot.instanceId);
    if (!result.ok) throw new Error('购买装备箱应成功: ' + result.reason);
    if (save.inventory.count !== countBefore + 1) throw new Error('购买装备箱后背包未增加装备');
  }

  // 余额不足
  save.account.consumeCurrency('gems', 10000);
  const gemItem = shop.getStock().find(s => !s.sold && s.itemId.startsWith('equip_crate_legend'));
  if (gemItem) {
    const result = shop.buy(gemItem.instanceId);
    if (result.ok) throw new Error('余额不足时不应购买成功');
  }

  // 手动刷新
  save.account.addCurrency('gems', 1000);
  const oldStock = shop.getStock().map(s => s.instanceId).join(',');
  const refreshResult = shop.refreshStock();
  if (!refreshResult.ok) throw new Error('手动刷新应成功: ' + refreshResult.reason);
  const newStock = shop.getStock().map(s => s.instanceId).join(',');
  if (oldStock === newStock) throw new Error('手动刷新后商品应变化');

  console.log('Shop tests passed');
}

run();
