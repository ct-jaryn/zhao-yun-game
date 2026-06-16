import { EQUIP_ICONS } from '../config.js';

export class DropItem {
  constructor(x, y, equip) {
    this.x = x; this.y = y; this.equip = equip;
    this.bobTime = Math.random() * Math.PI * 2;
    this.life = 45;
    this.pulseTime = 0;
  }
  update(dt) {
    this.bobTime += dt * 3;
    this.life -= dt;
    this.pulseTime += dt * 4;
  }
  draw(ctx, cam) {
    const by = Math.sin(this.bobTime) * 5;
    const sx = this.x - cam.x, sy = this.y - cam.y + by;
    const pulse = 1 + Math.sin(this.pulseTime) * 0.1;
    const color = this.equip.quality.color;

    ctx.shadowColor = color;
    ctx.shadowBlur = 12 * pulse;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4 + Math.sin(this.pulseTime) * 0.2;
    ctx.beginPath();
    ctx.arc(sx, sy, 16 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(sx, sy, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(EQUIP_ICONS[this.equip.type] || '?', sx, sy + 4);

    ctx.fillStyle = color;
    ctx.font = '11px "Microsoft YaHei"';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(this.equip.name, sx, sy - 18);
    ctx.fillText(this.equip.name, sx, sy - 18);

    if (this.life < 8 && Math.floor(this.life * 3) % 2) ctx.globalAlpha = 0.4;
    ctx.globalAlpha = 1;
  }
}
