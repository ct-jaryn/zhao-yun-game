import { rand, pick } from '../utils/index.js';
import { AssetLoader } from '../plugins/AssetLoader.js';

export class DiaoChan {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = 28;
    this.state = 'captive';
    this.helpTimer = 0;
    this.sparkleTimer = 0;
    this.animTimer = 0;
    this.tiedAnimTimer = 0;
    this.name = '貂蝉';
    this.rescuedAt = 0;
    this.dir = 0;
    this.drawH = 160;

    this.createGroundShadow();
    this.createSprite();
  }

  createGroundShadow() {
    this.shadow = this.scene.add.ellipse(
      this.x,
      this.y + this.radius * 0.78,
      this.radius * 2.1,
      this.radius * 0.6,
      0x120d09,
      0.32
    );
    this.shadow.setDepth(4);
  }

  createSprite() {
    const key = this.state === 'captive'
      ? AssetLoader.getFrameKey('diaochan_tied', 0)
      : AssetLoader.getEnemySliceKey('diaochan', this.dir);
    if (AssetLoader.hasTexture(this.scene, key)) {
      this.sprite = this.scene.add.sprite(this.x, this.y, key);
      this.sprite.setScale(0.62);
    } else {
      this.sprite = this.scene.add.sprite(this.x, this.y, '__WHITE');
      this.sprite.setDisplaySize(this.radius * 2, this.radius * 2);
      this.sprite.setTint(0xff6b9d);
    }
    this.sprite.setDepth(8);
  }

  update(dt, game) {
    this.animTimer += dt * 2;
    this.tiedAnimTimer += dt * 6;

    const p = game.player;
    this.dir = Math.atan2(p.y - this.y, p.x - this.x);

    if (this.state === 'captive') {
      this.helpTimer -= dt;
      if (this.helpTimer <= 0) {
        this.helpTimer = rand(2.5, 4.5);
        if (game && game.effectManager) {
          const msgs = ['将军救我！', '救命！', '妾身在此！', '赵云将军！'];
          game.effectManager.addText(this.x, this.y - 70, pick(msgs), '#ff69b4', 16, '#000');
        }
      }
    } else {
      this.rescuedAt += dt;
      this.sparkleTimer -= dt;
      if (this.sparkleTimer <= 0) {
        this.sparkleTimer = rand(0.4, 0.9);
      }
    }

    this.syncSprite();
  }

  rescue(game) {
    if (this.state === 'rescued') return;
    this.state = 'rescued';
    this.rescuedAt = 0;
    this.helpTimer = 0;

    if (game && game.effectManager) {
      game.effectManager.addText(this.x, this.y - 90, '谢谢将军！', '#ffd700', 24, '#000');
      game.effectManager.addParticles(this.x, this.y, '#ff69b4', 35, 140, 4);
      game.effectManager.addParticles(this.x, this.y, '#ffd700', 25, 110, 4);
      game.effectManager.shakeScreen(6);
      game.effectManager.flashScreen('#ff69b4', 0.3);
    }

    if (this.sprite) {
      const key = AssetLoader.getEnemySliceKey('diaochan', this.dir);
      if (AssetLoader.hasTexture(this.scene, key)) {
        this.sprite.setTexture(key);
      }
      this.sprite.setTint();
    }
  }

  syncSprite() {
    if (!this.sprite) return;
    const floatY = Math.sin(this.animTimer) * 3;
    this.sprite.setPosition(this.x, this.y + floatY);
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + this.radius * 0.78);
      this.shadow.setScale(1 - Math.abs(floatY) * 0.025, 1 - Math.abs(floatY) * 0.04);
    }

    if (this.state === 'captive') {
      const frame = Math.floor(this.tiedAnimTimer) % 6;
      const key = AssetLoader.getFrameKey('diaochan_tied', frame);
      if (AssetLoader.hasTexture(this.scene, key)) {
        this.sprite.setTexture(key);
      }
      this.sprite.setFlipX(this.dir > Math.PI / 2 || this.dir < -Math.PI / 2);
    } else {
      const key = AssetLoader.getEnemySliceKey('diaochan', this.dir);
      if (AssetLoader.hasTexture(this.scene, key)) {
        this.sprite.setTexture(key);
      }
      this.sprite.setFlipX(false);
    }
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
  }
}
