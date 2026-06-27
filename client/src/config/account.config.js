// 账号军阶奖励配置
export const RANK_REWARDS = {
  2: { coins: 500 },
  3: { coins: 800, souls: 10 },
  5: { coins: 1200, souls: 20, inventoryCapacity: 10 },
  10: { coins: 3000, souls: 50, unlockSkin: { heroId: 'zhaoyun', skin: 'mecha' } },
  15: { coins: 5000, souls: 80, inventoryCapacity: 10 },
  20: { coins: 8000, souls: 120 },
  30: { coins: 15000, souls: 200, inventoryCapacity: 20 },
  40: { coins: 25000, souls: 350 },
  50: { coins: 40000, souls: 500, inventoryCapacity: 30 },
  60: { coins: 60000, souls: 800 }
};

// 货币显示名称
export const CURRENCY_LABELS = {
  coins: '铜币',
  souls: '将魂',
  merit: '战功',
  gems: '元宝',
  strengtheningStone: '强化石',
  refineStone: '精炼石'
};

// 货币图标（可后续替换为图片路径）
export const CURRENCY_ICONS = {
  coins: '🪙',
  souls: '🔥',
  merit: '🎖️',
  gems: '💎',
  strengtheningStone: '⛏️',
  refineStone: '✨'
};
