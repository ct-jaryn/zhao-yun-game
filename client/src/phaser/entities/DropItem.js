export class DropItem {
  constructor(scene, x, y, equip) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.equip = equip;
    this.bobTime = Math.random() * Math.PI * 2;
    this.life = 45;
    this.pulseTime = 0;

    this.createSprite();
  }

  createSprite() {
    const color = parseInt(this.equip.quality.color.replace('#', '0x'), 16) || 0xffffff;
    const children = [];

    if (this.scene.textures.exists('drop_chest')) {
      const chest = this.scene.add.image(0, 0, 'drop_chest');
      chest.setDisplaySize(40, 40);
      children.push(chest);
    }

    const glow = this.scene.add.graphics();
    glow.lineStyle(2, color, 0.8);
    glow.strokeCircle(0, 0, 22);
    children.push(glow);

    this.sprite = this.scene.add.container(this.x, this.y, children);
    this.sprite.setDepth(6);
  }

  update(dt) {
    this.bobTime += dt * 3;
    this.life -= dt;
    this.pulseTime += dt * 4;

    const by = Math.sin(this.bobTime) * 5;
    this.sprite.setPosition(this.x, this.y + by);

    const alpha = (this.life < 8 && Math.floor(this.life * 3) % 2) ? 0.4 : 1;
    this.sprite.setAlpha(alpha);

    return this.life > 0;
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
