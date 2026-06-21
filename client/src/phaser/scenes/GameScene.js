import Phaser from 'phaser';
import { InputManager } from '../InputManager.js';
import { GameController } from '../GameController.js';
import { AnimationFactory } from '../plugins/AnimationFactory.js';
import { W, H, MAP_W, MAP_H } from '../utils/index.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.chapter = data.chapter || 1;
    this.skin = data.skin || 'classic';
  }

  create() {
    AnimationFactory.createAllAnimations(this);

    this.inputManager = new InputManager(this);
    this.controller = new GameController(this);
    this.controller.start(this.chapter, this.skin);

    this.setupBackground();
    this.setupUIEventBridge();

    const canvas = this.game.canvas;
    if (canvas && canvas.focus) canvas.focus();
  }

  setupBackground() {
    // 根据章节设置背景色或背景图
    const bgKey = `bg_chapter_${this.chapter}`;
    if (this.textures.exists(bgKey)) {
      const background = this.add.image(MAP_W / 2, MAP_H / 2, bgKey);
      background.setDisplaySize(MAP_W, MAP_H);
      background.setDepth(-10);
    } else {
      this.cameras.main.setBackgroundColor('#3a6b10');
    }

    // 章节色调遮罩
    const cfg = this.controller.chapterConfig;
    if (cfg && cfg.tint) {
      const match = cfg.tint.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = parseFloat(match[4]);
        const overlay = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, Phaser.Display.Color.GetColor(r, g, b), a);
        overlay.setDepth(-8);
      }
    }

    // 地图边界
    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0xff0000, 0.4);
    graphics.strokeRect(0, 0, MAP_W, MAP_H);
    graphics.setDepth(-5);
  }

  setupUIEventBridge() {
    this._onPause = () => { if (this.controller) this.controller.paused = true; };
    this._onResume = () => { if (this.controller) this.controller.paused = false; };
    this.events.on('pause', this._onPause);
    this.events.on('resume', this._onResume);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.inputManager.update();
    this.controller.update(dt, this.inputManager);
  }

  startChapter(chapter, skin) {
    this.scene.restart({ chapter, skin });
  }

  shutdown() {
    if (this.controller) {
      this.controller.shutdown();
      this.controller = null;
    }
    if (this.inputManager) {
      this.inputManager.destroy();
      this.inputManager = null;
    }
    if (this._onPause) {
      this.events.off('pause', this._onPause);
      this.events.off('resume', this._onResume);
      this._onPause = null;
      this._onResume = null;
    }
  }
}
