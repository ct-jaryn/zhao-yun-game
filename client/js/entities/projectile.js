import { vdist, vec } from '../utils.js';

export class Projectile {
  constructor(x, y, dir, speed, dmg, owner, color, size, life) {
    this.x = x; this.y = y; this.dir = dir;
    this.speed = speed; this.dmg = dmg; this.owner = owner;
    this.color = color || '#ff8800';
    this.size = size || 6;
    this.life = life || 2.0;
    this.hit = new Set();
    this.trail = [];
  }
  update(dt) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
    this.x += Math.cos(this.dir) * this.speed * dt;
    this.y += Math.sin(this.dir) * this.speed * dt;
    this.life -= dt;
  }
  draw(ctx, cam) {
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(t.x - cam.x, t.y - cam.y, this.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x - cam.x, this.y - cam.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
