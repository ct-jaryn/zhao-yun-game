export class Particle {
  constructor(scene) {
    this.scene = scene;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#ff8800';
    this.colorHex = 0xff8800;
    this.life = 0;
    this.maxLife = 0;
    this.size = 4;
    this.imgKey = null;
    this.active = false;
    this.sprite = null;
  }

  ensureSprite() {
    // 池化复用：sprite 仅在首次或纹理切换时创建，reset 时不再每次销毁重建
    if (this.sprite) return;
    this.sprite = this.scene.add.image(0, 0, '__WHITE');
    this.sprite.setDepth(20);
  }

  reset(scene, x, y, vx, vy, color, life, size, imgKey = null) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.colorHex = typeof color === 'string' && color.startsWith('#')
      ? parseInt(color.replace('#', '0x'), 16)
      : 0xff8800;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.imgKey = imgKey;
    this.active = true;

    this.ensureSprite();

    // 切换纹理：有专用粒子纹理则用纹理，否则用 __WHITE + tint
    const useTex = imgKey && scene.textures.exists(imgKey);
    if (useTex) {
      this.sprite.setTexture(imgKey);
      this.sprite.clearTint();
      this.sprite.setDisplaySize(this.size * 3, this.size * 3);
    } else {
      this.sprite.setTexture('__WHITE');
      this.sprite.setTint(this.colorHex);
      // 纯色粒子保持原 graphics 方块的尺寸（size×size）
      this.sprite.setDisplaySize(this.size, this.size);
    }
    this.sprite.setPosition(x, y);
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.setVisible(true);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.life -= dt;

    const alpha = Math.max(0, this.life / this.maxLife);
    if (this.sprite) {
      this.sprite.setPosition(this.x, this.y);
      this.sprite.setAlpha(alpha);
      // scale 相对 displaySize 衰减，保留原视觉行为
      this.sprite.setScale(alpha);
    }

    return this.life > 0;
  }

  deactivate() {
    this.active = false;
    if (this.sprite) {
      try { this.sprite.setVisible(false); } catch (e) {}
    }
  }

  destroy() {
    this.active = false;
    if (this.sprite) {
      try { this.sprite.destroy(); } catch (e) {}
      this.sprite = null;
    }
  }
}
