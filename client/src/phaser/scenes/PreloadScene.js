import Phaser from 'phaser';
import { AssetLoader } from '../plugins/AssetLoader.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.failedKeys = [];
    const loader = new AssetLoader(this);
    loader.loadAll();

    this.load.on('loaderror', file => {
      console.warn('[PreloadScene] 加载失败:', file.key);
      this.failedKeys.push(file.key);
    });

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.text(width / 2, height / 2 - 40, '正在加载资源...', {
      fontFamily: 'Noto Serif SC',
      fontSize: '28px',
      color: '#ffd700'
    }).setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 + 20, 320, 30);

    const percentText = this.add.text(width / 2, height / 2 + 35, '0%', {
      fontFamily: 'Noto Serif SC',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', value => {
      progressBar.clear();
      progressBar.fillStyle(0xffd700, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 25, 300 * value, 20);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      percentText.destroy();
    });
  }

  create() {
    this.game.registry.set('failedAssetKeys', this.failedKeys || []);
    window.dispatchEvent(new CustomEvent('phaserAssetsReady', { detail: { success: true, failed: this.failedKeys || [] } }));
    this.scene.stop('PreloadScene');
  }
}
