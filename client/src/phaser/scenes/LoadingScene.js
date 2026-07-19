import Phaser from 'phaser';
import { AssetLoader } from '../plugins/AssetLoader.js';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  init(data) {
    this.runConfig = data.runConfig || null;
    this.onComplete = data.onComplete || null;
    this._initData = data;
  }

  preload() {
    this.failedKeys = [];
    this.load.on('loaderror', file => {
      console.warn('[LoadingScene] 加载失败:', file.key);
      this.failedKeys.push(file.key);
    });

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.text(width / 2, height / 2 - 40, '加载战场资源…', {
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

    const loader = new AssetLoader(this);
    if (this.runConfig) {
      loader.loadPlayerAssets(this.runConfig.skin || 'classic');
      loader.loadChapterAssets(this.runConfig.chapter || 1);
    }
    loader.loadCommonAssets();
    loader.loadTerrainAssets();
    loader.loadEffectAssets();
  }

  async create() {
    this.game.registry.set('failedAssetKeys', this.failedKeys || []);

    let AnimationFactory = null;
    try {
      const mod = await import('../plugins/AnimationFactory.js');
      AnimationFactory = mod.AnimationFactory || null;
    } catch (err) {
      console.warn('[LoadingScene] AnimationFactory 不可用，跳过动画创建:', err);
    }

    if (AnimationFactory && this.runConfig) {
      const skin = this.runConfig.skin || 'classic';
      const chapter = this.runConfig.chapter || 1;

      AnimationFactory.createPlayerAnimations(this, skin);

      const enemyTypes = AssetLoader.getChapterEnemyTypes(chapter);
      for (const t of enemyTypes) {
        AnimationFactory.createEnemyAnimations(this, t);
      }

      if (chapter === 1) {
        AnimationFactory.createDiaoChanAnimation(this);
      }
    }

    this.scene.start('GameScene', this._initData);
  }
}
