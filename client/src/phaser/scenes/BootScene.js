import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // 预生成 1x1 白色纹理，供 Player/Enemy/DiaoChan 在目标切片加载失败时 fallback 使用
    // Phaser 3 默认只有 __DEFAULT/__MISSING，无 __WHITE
    if (!this.textures.exists('__WHITE')) {
      this.textures.generate('__WHITE', { data: ['0xffffff'], width: 1, height: 1 });
    }
    this.scene.start('PreloadScene');
  }
}
