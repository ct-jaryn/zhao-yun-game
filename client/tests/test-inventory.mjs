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

function run() {
  const accountData = createDefaultAccount();
  accountData.currencies.coins = 10000;
  accountData.currencies.strengtheningStone = 1000;
  const account = new Account(accountData);

  const inventory = new Inventory({ capacity: 50, items: [makeEquip()] });

  // 强化成功
  let result = inventory.enhance(0, account);
  if (!result.ok) throw new Error('强化应成功: ' + result.reason);
  const eq = inventory.getEquip(0);
  if (eq.enhanceLevel !== 1) throw new Error('强化等级应为 1');
  if ((eq.stats.atk || 0) <= 3) throw new Error('强化后攻击应提升');

  // 分解返还材料
  const salvage = inventory.salvage(0);
  if (!salvage) throw new Error('分解应成功');
  if (salvage.coins <= 0) throw new Error('分解应返还铜币');
  if (salvage.strengtheningStone <= 0) throw new Error('分解应返还强化石');
  if (inventory.count !== 0) throw new Error('分解后背包应为空');

  // 强化的装备分解应返还更多材料
  if (salvage.coins <= 10) throw new Error('强化后分解应返还更多铜币');

  console.log('Inventory enhance/salvage tests passed');
}

run();
