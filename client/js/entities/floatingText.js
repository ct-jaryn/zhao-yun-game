export class FloatingText {
  constructor(x, y, text, color, size, outline) {
    this.x = x; this.y = y; this.text = text;
    this.color = color;
    this.size = size || 16;
    this.outline = outline || (size >= 20 ? '#000' : null);
    this.life = 1.2;
    this.vy = -70;
  }
  update(dt) {
    this.y += this.vy * dt;
    this.vy *= 0.95;
    this.life -= dt;
  }
  draw(ctx, cam) {
    const alpha = Math.max(0, Math.min(1, this.life / 0.3));
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${this.size}px "Microsoft YaHei"`;
    ctx.textAlign = 'center';
    const sx = this.x - cam.x, sy = this.y - cam.y;
    if (this.outline) {
      ctx.strokeStyle = this.outline;
      ctx.lineWidth = 3;
      ctx.strokeText(this.text, sx, sy);
    }
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, sx, sy);
    ctx.globalAlpha = 1;
  }
}
