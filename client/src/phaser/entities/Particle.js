export class Particle {
  constructor(scene) {
    this.scene = scene;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#ff8800';
    this.life = 0;
    this.maxLife = 0;
    this.size = 4;
    this.imgKey = null;
    this.active = false;
    this.sprite = null;
  }

  reset(scene, x, y, vx, vy, color, life, size, imgKey = null) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.imgKey = imgKey;
    this.active = true;

    // 清理旧 sprite
    if (this.sprite) {
      try { this.sprite.destroy(); } catch (e) {}
      this.sprite = null;
    }

    if (this.imgKey && this.scene.textures.exists(this.imgKey)) {
      this.sprite = this.scene.add.image(this.x, this.y, this.imgKey);
      this.sprite.setDisplaySize(this.size * 3, this.size * 3);
    } else {
      const hex = typeof this.color === 'string' && this.color.startsWith('#')
        ? parseInt(this.color.replace('#', '0x'), 16)
        : 0xff8800;
      this.sprite = this.scene.add.graphics();
      this.sprite.fillStyle(hex, 1);
      this.sprite.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }

    this.sprite.setDepth(20);
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
