export {
  MAP_W, MAP_H, TERRAIN
} from '../../config/game.config.js';

import { TERRAIN } from '../../config/game.config.js';

export function isTerrainPositionClear(x, y, radius = 0, padding = 10) {
  return TERRAIN.every((obstacle) => {
    if (!obstacle.blocking) return true;
    return Math.hypot(x - obstacle.x, y - obstacle.y) >= obstacle.r + radius + padding;
  });
}

export function resolveTerrainCollision(entity, padding = 10) {
  for (const obstacle of TERRAIN) {
    if (!obstacle.blocking) continue;

    const dx = entity.x - obstacle.x;
    const dy = entity.y - obstacle.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = obstacle.r + entity.radius + padding;
    if (distance >= minDistance) continue;

    const nx = distance > 0.001 ? dx / distance : 1;
    const ny = distance > 0.001 ? dy / distance : 0;
    entity.x = obstacle.x + nx * minDistance;
    entity.y = obstacle.y + ny * minDistance;
  }
}

export function vec(x, y) { return { x, y }; }
export function vsub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
export function vlen(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
export function vnorm(v) { const l = vlen(v) || 1; return { x: v.x / l, y: v.y / l }; }
export function vdist(a, b) { return vlen(vsub(a, b)); }

export function rand(a, b) { return Math.random() * (b - a) + a; }
export function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
export function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function screenToWorld(scene, sx, sy) {
  const camera = scene.cameras.main;
  return {
    x: sx + camera.scrollX,
    y: sy + camera.scrollY
  };
}
