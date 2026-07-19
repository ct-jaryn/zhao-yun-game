import Phaser from 'phaser';
import { InputManager } from '../InputManager.js';
import { GameController } from '../GameController.js';
import { RunConfig } from '../../game/RunConfig.js';
import { TERRAIN } from '../../config/game.config.js';
import { MAP_W, MAP_H } from '../utils/index.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.runConfig = data.runConfig || null;
    this.chapter = data.chapter || (this.runConfig ? this.runConfig.chapter : 1);
    this.skin = data.skin || (this.runConfig ? this.runConfig.skin : 'classic');
    this._onRunCompleteCallback = data.onComplete || null;
  }

  create() {
    this.inputManager = new InputManager(this);
    this.controller = new GameController(this);

    if (this._onRunCompleteCallback) {
      this.controller.setOnRunCompleteCallback(this._onRunCompleteCallback);
    }

    this.controller.start(this.runConfig);

    this.setupBackground();

    const canvas = this.game.canvas;
    if (canvas && canvas.focus) canvas.focus();
  }

  setupBackground() {
    this._bgObjects = [];

    // 根据章节设置背景色或背景图
    const bgKey = `bg_chapter_${this.chapter}`;
    if (this.textures.exists(bgKey)) {
      const background = this.add.image(MAP_W / 2, MAP_H / 2, bgKey);
      background.setDisplaySize(MAP_W, MAP_H);
      background.setDepth(-10);
      this._bgObjects.push(background);
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
        this._bgObjects.push(overlay);
      }
    }

    // 将地图配置中的障碍点表现为可复用的战场装饰，保持在实体和特效之前渲染
    const terrainKeys = {
      rock: 'terrain_rock',
      banner: 'terrain_banner',
      fallen_tree: 'terrain_fallen_tree'
    };
    TERRAIN.forEach((obstacle, index) => {
      const key = terrainKeys[obstacle.kind] || Object.values(terrainKeys)[index % 3];
      if (!this.textures.exists(key)) return;

      const prop = this.add.image(obstacle.x, obstacle.y, key);
      prop.setOrigin(0.5, 1);

      if (key === 'terrain_fallen_tree') {
        prop.setDisplaySize(obstacle.r * 2.8, obstacle.r * 2.1);
      } else if (key === 'terrain_banner') {
        prop.setDisplaySize(obstacle.r * 1.75, obstacle.r * 2.4);
      } else {
        prop.setDisplaySize(obstacle.r * 2.25, obstacle.r * 2.0);
      }

      prop.setRotation(obstacle.rotation || 0);
      prop.setAlpha(obstacle.kind === 'banner' ? 0.84 : 0.9);
      prop.setDepth(-4);
      this._bgObjects.push(prop);
    });

    // 地图边界
    const graphics = this.add.graphics();
    graphics.lineStyle(5, 0xd6ad63, 0.42);
    graphics.strokeRect(0, 0, MAP_W, MAP_H);
    graphics.lineStyle(2, 0x2a1b12, 0.35);
    graphics.strokeRect(24, 24, MAP_W - 48, MAP_H - 48);
    graphics.setDepth(-5);
    this._bgObjects.push(graphics);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.inputManager.update();
    this.controller.update(dt, this.inputManager);
  }

  startChapter(chapter, skin) {
    const heroData = RunConfig.createDefaultHeroData('zhaoyun');
    const runConfig = new RunConfig({ heroId: 'zhaoyun', skin, chapter, difficulty: 'normal', mode: 'story', heroData });
    this.scene.restart({ runConfig });
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

    // 清理背景对象
    if (this._bgObjects) {
      for (const obj of this._bgObjects) {
        if (obj && obj.active) obj.destroy();
      }
      this._bgObjects = null;
    }

    this.tweens && this.tweens.killAll();
    this.time && this.time.removeAllEvents();

    this.runConfig = null;
    this._onRunCompleteCallback = null;
  }
}
