import { describe, it, expect } from 'vitest';
import { Inventory } from '../src/save/Inventory.js';
import { Account } from '../src/save/Account.js';
import { createDefaultAccount } from '../src/save/schemas.js';
import { QUALITY } from '../src/config/index.js';
import { generateGem } from '../src/config/gems.config.js';

function makeEquip() {
  return {
    type: '武器',
    name: '亮银枪',
    quality: QUALITY[2],
    stats: { atk: 10, crit: 3 },
    level: 1,
    tier: 2
  };
}

describe('equipment refine/wash/inlay/salvage', () => {
  it('refines, washes, inlays and salvages equipment correctly', () => {
    const accountData = createDefaultAccount();
    accountData.currencies.coins = 100000;
    accountData.currencies.strengtheningStone = 1000;
    accountData.currencies.refineStone = 1000;
    const account = new Account(accountData);

    const inventory = new Inventory({ capacity: 50, items: [makeEquip()] });

    const refineResult = inventory.refine(0, account);
    expect(refineResult.ok).toBe(true);

    const eq = inventory.getEquip(0);
    expect(eq.refineLevel).toBe(1);
    expect(eq.stats.atk || 0).toBeGreaterThan(10);

    const beforeWash = { ...eq.stats };
    const washResult = inventory.wash(0, account);
    expect(washResult.ok).toBe(true);
    expect(eq.washCount).toBe(1);
    expect(Object.keys(eq.washStats || {}).length).toBeGreaterThan(0);

    const gem = generateGem(12345, 2);
    account.addGem(gem);
    const inlayResult = inventory.inlayGem(0, gem, account);
    expect(inlayResult.ok).toBe(true);
    expect(account.gemItems.length).toBe(0);
    expect(eq.gemSockets || []).toHaveLength(1);

    const salvage = inventory.salvage(0);
    expect(salvage).toBeTruthy();
    expect(salvage.refineStone).toBeGreaterThanOrEqual(0);
  });
});
