import { EQUIP_TYPES, QUALITY, ZHAO_YUN_EQUIP_TIERS } from './equipment.config.js';

export const SHOP_CATEGORIES = {
  material: { name: '材料', icon: '🔷' },
  equip: { name: '装备宝箱', icon: '📦' },
  special: { name: '特殊', icon: '✨' }
};

export const SHOP_REFRESH_COST = 50; // 元宝
export const SHOP_DAILY_SLOTS = 6;

export const SHOP_ITEMS = [
  {
    id: 'coins_small',
    category: 'material',
    name: '铜币袋（小）',
    icon: '🪙',
    desc: '获得 500 铜币',
    cost: { type: 'gems', amount: 10 },
    effect: { type: 'currency', currency: 'coins', amount: 500 }
  },
  {
    id: 'coins_large',
    category: 'material',
    name: '铜币袋（大）',
    icon: '🪙',
    desc: '获得 3000 铜币',
    cost: { type: 'gems', amount: 50 },
    effect: { type: 'currency', currency: 'coins', amount: 3000 }
  },
  {
    id: 'souls_small',
    category: 'material',
    name: '将魂匣（小）',
    icon: '🔥',
    desc: '获得 50 将魂',
    cost: { type: 'merit', amount: 100 },
    effect: { type: 'currency', currency: 'souls', amount: 50 }
  },
  {
    id: 'souls_large',
    category: 'material',
    name: '将魂匣（大）',
    icon: '🔥',
    desc: '获得 300 将魂',
    cost: { type: 'merit', amount: 500 },
    effect: { type: 'currency', currency: 'souls', amount: 300 }
  },
  {
    id: 'strengthening_stone',
    category: 'material',
    name: '强化石礼包',
    icon: '🔷',
    desc: '获得 30 强化石',
    cost: { type: 'coins', amount: 2000 },
    effect: { type: 'currency', currency: 'strengtheningStone', amount: 30 }
  },
  {
    id: 'refine_stone',
    category: 'material',
    name: '精炼石礼包',
    icon: '✨',
    desc: '获得 10 精炼石',
    cost: { type: 'merit', amount: 200 },
    effect: { type: 'currency', currency: 'refineStone', amount: 10 }
  },
  {
    id: 'equip_crate_normal',
    category: 'equip',
    name: '普通装备箱',
    icon: '📦',
    desc: '随机获得一件普通~精良装备',
    cost: { type: 'coins', amount: 1500 },
    effect: { type: 'equipCrate', minQuality: 0, maxQuality: 1, tier: 1 }
  },
  {
    id: 'equip_crate_rare',
    category: 'equip',
    name: '稀有装备箱',
    icon: '📦',
    desc: '随机获得一件稀有~史诗装备',
    cost: { type: 'merit', amount: 300 },
    effect: { type: 'equipCrate', minQuality: 2, maxQuality: 3, tier: 2 }
  },
  {
    id: 'equip_crate_legend',
    category: 'equip',
    name: '传说装备箱',
    icon: '📦',
    desc: '随机获得一件史诗~传说装备',
    cost: { type: 'gems', amount: 200 },
    effect: { type: 'equipCrate', minQuality: 3, maxQuality: 4, tier: 3 }
  },
  {
    id: 'inventory_expand',
    category: 'special',
    name: '背包扩展',
    icon: '🎒',
    desc: '背包容量 +10',
    cost: { type: 'gems', amount: 100 },
    effect: { type: 'inventoryExpand', amount: 10 }
  }
];

export function getShopItem(id) {
  return SHOP_ITEMS.find(i => i.id === id) || null;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateShopStock(seed, count = SHOP_DAILY_SLOTS) {
  const rand = mulberry32(seed);
  const stock = [];
  for (let i = 0; i < count; i++) {
    const item = SHOP_ITEMS[Math.floor(rand() * SHOP_ITEMS.length)];
    stock.push({ itemId: item.id, sold: false, instanceId: `${Date.now()}-${i}-${Math.floor(rand() * 1000000)}` });
  }
  return stock;
}

export function generateCrateEquip(seed, minQuality, maxQuality, tier) {
  const rand = mulberry32(seed);
  const type = EQUIP_TYPES[Math.floor(rand() * EQUIP_TYPES.length)];
  const qualityIndex = minQuality + Math.floor(rand() * (maxQuality - minQuality + 1));
  const quality = QUALITY[qualityIndex];
  const actualTier = Math.min(4, Math.max(0, tier + Math.floor(rand() * 2) - 1));
  const tierData = ZHAO_YUN_EQUIP_TIERS[actualTier][type];
  const stats = {};
  for (const [k, v] of Object.entries(tierData.stats)) {
    stats[k] = Math.floor(v * quality.mult * (0.9 + rand() * 0.2));
  }
  return {
    type,
    name: tierData.name,
    quality,
    stats,
    baseStats: { ...stats },
    level: actualTier * 5 + 1,
    tier: actualTier
  };
}
