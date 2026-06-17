import { vdist, vec } from '../utils.js';

export class Projectile {
  constructor(x, y, dir, speed, dmg, owner, color, size, life, img = null) {
    this.x = x; this.y = y; this.dir = dir;
    this.speed = speed; this.dmg = dmg; this.owner = owner;
    this.color = color || '#ff8800';
    this.size = size || 6;
    this.life = life || 2.0;
    this.img = img;
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
    const sx = this.x - cam.x, sy = this.y - cam.y;
    if (this.img && this.img.complete && this.img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.dir);
      const h = this.size * 2.2;
      const w = h * (this.img.naturalWidth / this.img.naturalHeight);
      ctx.drawImage(this.img, -w / 2, -h / 2, w, h);
      ctx.restore();
      return;
    }

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
    ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
