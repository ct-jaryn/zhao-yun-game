export const W = 1000;
export const H = 700;
export const MAP_W = 3000;
export const MAP_H = 2000;

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
