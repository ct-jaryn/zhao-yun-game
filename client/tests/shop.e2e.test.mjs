import { describe, it, expect } from 'vitest';
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

describe('shop', () => {
  it('sells items, expands inventory, opens crates and refreshes stock', () => {
    const save = makeSaveManager();
    save.account.addCurrency('gems', 1000);
    save.account.addCurrency('merit', 1000);
    save.account.addCurrency('coins', 10000);

    const shop = new Shop(save);
    const stock = shop.getStock();
    expect(stock).toHaveLength(6);

    const slot = stock.find(s => s.itemId === 'coins_small');
    expect(slot).toBeTruthy();
    const beforeCoins = save.account.getCurrency('coins');
    const buyResult = shop.buy(slot.instanceId);
    expect(buyResult.ok).toBe(true);
    expect(save.account.getCurrency('coins')).toBe(beforeCoins + 500);
    expect(slot.sold).toBe(true);

    const expandSlot = stock.find(s => s.itemId === 'inventory_expand');
    expect(expandSlot).toBeTruthy();
    const beforeCapacity = save.inventory.capacity;
    const expandResult = shop.buy(expandSlot.instanceId);
    expect(expandResult.ok).toBe(true);
    expect(save.inventory.capacity).toBe(beforeCapacity + 10);

    const crateSlot = stock.find(s => s.itemId && s.itemId.startsWith('equip_crate'));
    expect(crateSlot).toBeTruthy();
    const countBefore = save.inventory.count;
    const crateResult = shop.buy(crateSlot.instanceId);
    expect(crateResult.ok).toBe(true);
    expect(save.inventory.count).toBe(countBefore + 1);

    save.account.consumeCurrency('gems', 10000);
    const gemItem = shop.getStock().find(s => !s.sold && s.itemId.startsWith('equip_crate_legend'));
    if (gemItem) {
      const brokeResult = shop.buy(gemItem.instanceId);
      expect(brokeResult.ok).toBe(false);
    }

    save.account.addCurrency('gems', 1000);
    const oldStock = shop.getStock().map(s => s.instanceId).join(',');
    const refreshResult = shop.refreshStock();
    expect(refreshResult.ok).toBe(true);
    const newStock = shop.getStock().map(s => s.instanceId).join(',');
    expect(newStock).not.toBe(oldStock);
  });
});
