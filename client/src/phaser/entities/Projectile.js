import { MAP_W, MAP_H } from '../../config/index.js';

export class Projectile {
  constructor(scene, x, y, dir, speed, dmg, owner, color = '#ff8800', size = 6, life = 2.0, imgKey = null, pierce = false) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.speed = speed;
    this.dmg = dmg;
    this.owner = owner;
    this.color = color;
    this.size = size;
    this.life = life;
    this.imgKey = imgKey;
    this.pierce = pierce;
    this.hit = new Set();
    this.trail = [];

    this.createSprite();
  }

  createSprite() {
    const key = this.imgKey || this.defaultTextureKey();
    if (key && this.scene.textures.exists(key)) {
      this.sprite = this.scene.add.sprite(this.x, this.y, key);
      this.sprite.setScale(key === 'projectile_arrow' ? 0.5 : 0.6);
      this.sprite.setRotation(this.dir);
    } else {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(parseInt(this.color.replace('#', '0x'), 16) || 0xff8800, 1);
      graphics.fillRect(-this.size * 1.5, -this.size / 2, this.size * 3, this.size);
      this.sprite = this.scene.add.container(this.x, this.y, [graphics]);
      this.sprite.setRotation(this.dir);
    }
    this.sprite.setDepth(7);
  }

  defaultTextureKey() {
    if (this.owner === 'enemy') return 'projectile_arrow';
    if (this.color === '#ffd700') return 'projectile_spear';
    return null;
  }

  update(dt) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();

    this.x += Math.cos(this.dir) * this.speed * dt;
    this.y += Math.sin(this.dir) * this.speed * dt;
    this.life -= dt;

    this.sprite.setPosition(this.x, this.y);
    this.sprite.setRotation(this.dir);

    if (this.life <= 0) {
      this.destroy();
      return false;
    }
    // 飞出地图边界一定距离即淘汰，避免持续更新无意义位置
    const M = 200;
    if (this.x < -M || this.x > MAP_W + M || this.y < -M || this.y > MAP_H + M) {
      this.destroy();
      return false;
    }
    return true;
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
