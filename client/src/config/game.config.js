export const W = 1200;
export const H = 675;
// 保持与 16:9 背景素材一致，同时给战斗留出更完整的外围空间
export const MAP_W = 3600;
export const MAP_H = 2025;

// 中央出生区保持开阔，四条边路承担刷怪和探索压力
export const TERRAIN = [
  { x:360, y:300, r:105, kind: 'rock', blocking: true },
  { x:1020, y:260, r:78, kind: 'banner', blocking: false },
  { x:1760, y:300, r:102, kind: 'fallen_tree', blocking: true },
  { x:2700, y:300, r:108, kind: 'rock', blocking: true },
  { x:3320, y:520, r:74, kind: 'banner', blocking: false },
  { x:3370, y:1500, r:112, kind: 'fallen_tree', blocking: true },
  { x:2860, y:1810, r:102, kind: 'rock', blocking: true },
  { x:2140, y:1815, r:78, kind: 'banner', blocking: false },
  { x:1400, y:1800, r:112, kind: 'fallen_tree', blocking: true },
  { x:500, y:1690, r:96, kind: 'rock', blocking: true },
  { x:260, y:1210, r:76, kind: 'banner', blocking: false },
  { x:520, y:760, r:108, kind: 'fallen_tree', blocking: true },
  { x:980, y:720, r:92, kind: 'rock', blocking: true },
  { x:960, y:1340, r:76, kind: 'banner', blocking: false },
  { x:2600, y:720, r:108, kind: 'fallen_tree', blocking: true },
  { x:2580, y:1320, r:94, kind: 'rock', blocking: true },
  { x:1780, y:610, r:70, kind: 'banner', blocking: false },
  { x:1840, y:1480, r:72, kind: 'banner', blocking: false }
];
