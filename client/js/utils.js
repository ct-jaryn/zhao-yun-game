import { W, H } from './config.js';

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const minimapCanvas = document.getElementById('minimap');
export const minimapCtx = minimapCanvas.getContext('2d');

export const screenShake = { x:0, y:0, intensity:0, decay:0 };

export function resizeCanvas() {
  const container = document.getElementById('gameContainer');
  const rect = container.getBoundingClientRect();
  const scale = Math.min(rect.width / W, rect.height / H);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
  return { scale, rect };
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

export function screenToWorld(sx, sy, cam) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (sx - rect.left) * scaleX + cam.x,
    y: (sy - rect.top) * scaleY + cam.y
  };
}

export function shakeScreen(intensity) {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
  screenShake.decay = 12;
}

export function flashScreen(color, duration = 0.15) {
  const el = document.getElementById('screenFlash');
  el.style.background = color;
  el.style.opacity = '0.35';
  setTimeout(() => el.style.opacity = '0', duration * 1000);
}

export function updateScreenShake(dt) {
  if (screenShake.intensity > 0) {
    screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.intensity *= Math.exp(-screenShake.decay * dt);
    if (screenShake.intensity < 0.3) screenShake.intensity = 0;
  } else {
    screenShake.x = 0;
    screenShake.y = 0;
  }
}
