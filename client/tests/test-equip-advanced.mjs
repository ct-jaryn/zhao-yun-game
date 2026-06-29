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

function run() {
  const accountData = createDefaultAccount();
  accountData.currencies.coins = 100000;
  accountData.currencies.strengtheningStone = 1000;
  accountData.currencies.refineStone = 1000;
  const account = new Account(accountData);

  const inventory = new Inventory({ capacity: 50, items: [makeEquip()] });

  // 精炼
  let result = inventory.refine(0, account);
  if (!result.ok) throw new Error('精炼应成功: ' + result.reason);
  const eq = inventory.getEquip(0);
  if (eq.refineLevel !== 1) throw new Error('精炼等级应为 1');
  if ((eq.stats.atk || 0) <= 10) throw new Error('精炼后攻击应提升');

  // 洗练
  const beforeWash = { ...eq.stats };
  result = inventory.wash(0, account);
  if (!result.ok) throw new Error('洗练就成功: ' + result.reason);
  if (eq.washCount !== 1) throw new Error('洗练次数应为 1');
  if (Object.keys(eq.washStats || {}).length === 0) throw new Error('洗练应产生随机属性');

  // 镶嵌
  const gem = generateGem(12345, 2);
  account.addGem(gem);
  result = inventory.inlayGem(0, gem, account);
  if (!result.ok) throw new Error('镶嵌应成功: ' + result.reason);
  if (account.gems.length !== 0) throw new Error('镶嵌后宝石应从背包移除');
  if ((eq.gemSockets || []).length !== 1) throw new Error('装备应有 1 个镶嵌宝石');

  // 分解应返还精炼石
  const salvage = inventory.salvage(0);
  if (!salvage) throw new Error('分解应成功');
  if (salvage.refineStone < 0) throw new Error('分解精炼装备应返还精炼石');

  console.log('Equipment refine/wash/inlay tests passed');
}

run();
