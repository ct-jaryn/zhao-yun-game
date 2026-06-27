import Phaser from 'phaser';
import { InputManager } from '../InputManager.js';
import { GameController } from '../GameController.js';
import { AnimationFactory } from '../plugins/AnimationFactory.js';
import { AssetLoader } from '../plugins/AssetLoader.js';
import { RunConfig } from '../../game/RunConfig.js';
import { W, H, MAP_W, MAP_H } from '../utils/index.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.runConfig = data.runConfig || null;
    this.chapter = data.chapter || (this.runConfig ? this.runConfig.chapter : 1);
    this.skin = data.skin || (this.runConfig ? this.runConfig.skin : 'classic');
  }

  preload() {
    // 按章节加载敌人/背景/貂蝉资源（启动阶段只加载了玩家与通用资源）
    const loader = new AssetLoader(this);
    loader.loadChapterAssets(this.chapter);

    // 章节资源量较小，通常已缓存，加载极快；这里仍提供轻量进度提示
    const tip = this.add.text(W / 2, H / 2, '进入战场…', {
      fontFamily: 'Noto Serif SC',
      fontSize: '22px',
      color: '#ffd700'
    }).setOrigin(0.5).setDepth(1000);
    this.load.once('complete', () => tip.destroy());
  }

  create() {
    // 仅创建本章节所需的动画（避免为未加载纹理创建空动画）
    AnimationFactory.createPlayerAnimations(this, 'classic');
    AnimationFactory.createPlayerAnimations(this, 'mecha');
    const enemyTypes = AssetLoader.getChapterEnemyTypes(this.chapter);
    for (const t of enemyTypes) AnimationFactory.createEnemyAnimations(this, t);
    if (this.chapter === 1) AnimationFactory.createDiaoChanAnimation(this);

    this.inputManager = new InputManager(this);
    this.controller = new GameController(this);

    const onComplete = window.gameApp ? window.gameApp.consumeRunCompleteCallback() : null;
    if (onComplete) {
      this.controller.setOnRunCompleteCallback(onComplete);
    }

    this.controller.start(this.runConfig);

    this.setupBackground();

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
    // 已移除：原代码监听 Phaser 场景 pause/resume 事件并直接置 controller.paused，
    // 绕过暂停栈（pauseStack/pauseReasons），会导致暂停状态不一致。
    // 且该事件从未被触发，属死代码。暂停统一由 GameController.addPause/removePause 管理。
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.inputManager.update();
    this.controller.update(dt, this.inputManager);
  }

  startChapter(chapter, skin) {
    const runConfig = new RunConfig({ heroId: 'zhaoyun', skin, chapter, difficulty: 'normal', mode: 'story' });
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
  }
}
