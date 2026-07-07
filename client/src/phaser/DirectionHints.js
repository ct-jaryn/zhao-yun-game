import { W, H } from '../config/game.config.js';
import { isBossType } from '../config/index.js';

export class DirectionHints {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100);
    this.graphics.setScrollFactor(0);
    this.arrows = [];
  }

  update(enemies) {
    const cam = this.scene.cameras.main;
    const margin = 40;
    const cx = W / 2;
    const cy = H / 2;

    // 复用箭头对象
    let used = 0;
    const useTexture = this.scene.textures.exists('hint_arrow');

    // 仅在 fallback（非纹理）模式下使用 graphics，避免无意义的每帧 clear
    if (!useTexture) this.graphics.clear();

    for (const e of enemies) {
      if (e.dead) continue;
      const sx = e.x - cam.scrollX;
      const sy = e.y - cam.scrollY;
      if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) continue;

      const angle = Math.atan2(sy - cy, sx - cx);
      const ax = Math.max(margin, Math.min(W - margin, cx + Math.cos(angle) * Math.min(W, H) * 0.45));
      const ay = Math.max(margin, Math.min(H - margin, cy + Math.sin(angle) * Math.min(W, H) * 0.45));

      const isBoss = isBossType(e.type);
      const size = isBoss ? 22 : 18;

      if (useTexture) {
        let arrow;
        if (used < this.arrows.length) {
          arrow = this.arrows[used];
          arrow.setVisible(true);
        } else {
          arrow = this.scene.add.image(0, 0, 'hint_arrow');
          arrow.setDepth(100);
          arrow.setScrollFactor(0);
          this.arrows.push(arrow);
        }
        arrow.setPosition(ax, ay);
        arrow.setRotation(angle);
        arrow.setDisplaySize(size, size);
        arrow.setTint(isBoss ? 0xff44ff : 0xff4444);
        arrow.setAlpha(0.9);
        used++;
      } else {
        const color = isBoss ? 0xff44ff : 0xff4444;
        this.graphics.fillStyle(color, isBoss ? 0.85 : 0.75);
        this.graphics.lineStyle(2, 0x000000, 0.6);
        const p1x = ax + Math.cos(angle) * size;
        const p1y = ay + Math.sin(angle) * size;
        const p2x = ax + Math.cos(angle + 2.5) * (size * 0.75);
        const p2y = ay + Math.sin(angle + 2.5) * (size * 0.75);
        const p3x = ax + Math.cos(angle - 2.5) * (size * 0.75);
        const p3y = ay + Math.sin(angle - 2.5) * (size * 0.75);
        this.graphics.beginPath();
        this.graphics.moveTo(p1x, p1y);
        this.graphics.lineTo(p2x, p2y);
        this.graphics.lineTo(p3x, p3y);
        this.graphics.closePath();
        this.graphics.fillPath();
        this.graphics.strokePath();
      }
    }

    if (useTexture) {
      for (let i = used; i < this.arrows.length; i++) {
        this.arrows[i].setVisible(false);
      }
    }
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
    for (const arrow of this.arrows) {
      if (arrow) arrow.destroy();
    }
    this.arrows = [];
    this.scene = null;
  }
}
