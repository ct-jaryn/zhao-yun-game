import { MAP_W, MAP_H, TERRAIN } from '../config.js';

export class MinimapRenderer {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.mw = 140;
    this.mh = 110;
  }

  update() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const mw = this.mw;
    const mh = this.mh;

    ctx.clearRect(0, 0, mw, mh);
    ctx.fillStyle = 'rgba(45,30,20,0.85)';
    ctx.fillRect(0, 0, mw, mh);

    ctx.strokeStyle = 'rgba(200,162,85,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, mw, mh);

    const sx = mw / MAP_W;
    const sy = mh / MAP_H;

    ctx.fillStyle = 'rgba(60,40,25,0.6)';
    for (const f of TERRAIN) {
      ctx.beginPath();
      ctx.arc(f.x * sx, f.y * sy, Math.max(2, f.r * sx * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    const p = this.game.player;
    if (!p) return;

    const hasIcons = this.game.scene.textures.exists('minimap_player');

    const drawIcon = (key, x, y, w, h, fallbackColor, fallbackSize) => {
      const mx = x * sx;
      const my = y * sy;
      if (hasIcons && key && this.game.scene.textures.exists(key)) {
        const tex = this.game.scene.textures.get(key).getSourceImage();
        const tw = tex.width;
        const th = tex.height;
        const dw = w || tw;
        const dh = h || th;
        try {
          ctx.drawImage(tex, mx - dw / 2, my - dh / 2, dw, dh);
        } catch (e) {
          ctx.fillStyle = fallbackColor;
          ctx.beginPath();
          ctx.arc(mx, my, fallbackSize, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = fallbackColor;
        ctx.beginPath();
        ctx.arc(mx, my, fallbackSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // 玩家
    drawIcon('minimap_player', p.x, p.y, 10, 10, '#44ff44', 3);

    // 敌人
    for (const e of this.game.enemies) {
      if (e.dead) continue;
      const isBoss = e.type === 'boss' || e.type === 'lubu' || e.type === 'dianwei' || e.type === 'xuzhu';
      drawIcon(isBoss ? 'minimap_boss' : null, e.x, e.y, isBoss ? 10 : 6, isBoss ? 10 : 6, isBoss ? '#ff44ff' : '#ff4444', isBoss ? 3 : 2);
    }

    // 掉落物
    if (this.game.dropManager) {
      for (const d of this.game.dropManager.drops) {
        if (d.life <= 0) continue;
        drawIcon('minimap_drop', d.x, d.y, 8, 8, d.equip ? d.equip.quality.color : '#ffffff', 2);
      }
    }

    // 貂蝉
    const dc = this.game.phaseManager ? this.game.phaseManager.diaochan : null;
    if (dc) {
      ctx.fillStyle = dc.state === 'captive' ? '#ff69b4' : '#ffd700';
      ctx.beginPath();
      ctx.arc(dc.x * sx, dc.y * sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 相机视野
    const cam = this.game.scene.cameras.main;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(cam.scrollX * sx, cam.scrollY * sy, cam.width * sx, cam.height * sy);

    ctx.strokeStyle = 'rgba(200,162,85,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, mw, mh);
  }
}
