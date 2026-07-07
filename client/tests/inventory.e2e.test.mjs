import { describe, it, expect } from 'vitest';
import { Inventory } from '../src/save/Inventory.js';
import { Account } from '../src/save/Account.js';
import { createDefaultAccount } from '../src/save/schemas.js';
import { QUALITY } from '../src/config/index.js';

function makeEquip() {
  return {
    type: '武器',
    name: '木枪',
    quality: QUALITY[0],
    stats: { atk: 3 },
    level: 1,
    tier: 0
  };
}

describe('inventory enhance/salvage', () => {
  it('enhances equipment and salvages it for materials', () => {
    const accountData = createDefaultAccount();
    accountData.currencies.coins = 10000;
    accountData.currencies.strengtheningStone = 1000;
    const account = new Account(accountData);

    const inventory = new Inventory({ capacity: 50, items: [makeEquip()] });

    const enhanceResult = inventory.enhance(0, account);
    expect(enhanceResult.ok).toBe(true);

    const eq = inventory.getEquip(0);
    expect(eq.enhanceLevel).toBe(1);
    expect(eq.stats.atk || 0).toBeGreaterThan(3);

    const salvage = inventory.salvage(0);
    expect(salvage).toBeTruthy();
    expect(salvage.coins).toBeGreaterThan(0);
    expect(salvage.strengtheningStone).toBeGreaterThan(0);
    expect(inventory.count).toBe(0);
    expect(salvage.coins).toBeGreaterThan(10);
  });
});
