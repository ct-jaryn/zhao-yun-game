export const GEM_TYPES = {
  ruby: { id: 'ruby', name: '红宝石', stat: 'atk', icon: '🔴' },
  sapphire: { id: 'sapphire', name: '蓝宝石', stat: 'mp', icon: '🔵' },
  emerald: { id: 'emerald', name: '绿宝石', stat: 'hp', icon: '🟢' },
  topaz: { id: 'topaz', name: '黄宝石', stat: 'crit', icon: '🟡' },
  amethyst: { id: 'amethyst', name: '紫水晶', stat: 'def', icon: '🟣' },
  onyx: { id: 'onyx', name: '黑玛瑙', stat: 'spd', icon: '⚫' }
};

export const GEM_QUALITIES = [
  { name: '普通', mult: 1.0, color: '#e8e8e8' },
  { name: '精良', mult: 1.5, color: '#44ff44' },
  { name: '稀有', mult: 2.2, color: '#4488ff' },
  { name: '史诗', mult: 3.0, color: '#aa44ff' },
  { name: '传说', mult: 4.0, color: '#ffd700' }
];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateGem(seed, qualityIndex = null) {
  const rand = mulberry32(seed);
  const typeKeys = Object.keys(GEM_TYPES);
  const typeKey = typeKeys[Math.floor(rand() * typeKeys.length)];
  const type = GEM_TYPES[typeKey];
  const qi = qualityIndex !== null ? qualityIndex : Math.floor(rand() * GEM_QUALITIES.length);
  const quality = GEM_QUALITIES[Math.min(4, Math.max(0, qi))];
  const baseValue = 2 + Math.floor(rand() * 4);
  const value = Math.max(1, Math.floor(baseValue * quality.mult));
  return {
    id: type.id,
    name: `${quality.name}${type.name}`,
    stat: type.stat,
    value,
    quality,
    icon: type.icon,
    seed
  };
}
