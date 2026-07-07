import Phaser from 'phaser';
import { W, H } from '../config/game.config.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { LoadingScene } from './scenes/LoadingScene.js';
import { GameScene } from './scenes/GameScene.js';
import { RunConfig } from '../game/RunConfig.js';

export class GameApp {
  constructor() {
    const canvas = document.getElementById('gameCanvas');
    const parent = document.getElementById('gameContainer');

    this.config = {
      type: Phaser.CANVAS,
      width: W,
      height: H,
      canvas,
      parent,
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [BootScene, PreloadScene, LoadingScene, GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      render: {
        pixelArt: false,
        antialias: true
      }
    };

    this.game = new Phaser.Game(this.config);
  }

  startChapter(chapter = 1, skin = 'classic') {
    const heroData = RunConfig.createDefaultHeroData('zhaoyun');
    const runConfig = new RunConfig({
      heroId: 'zhaoyun',
      skin,
      chapter,
      difficulty: 'normal',
      mode: 'story',
      heroData
    });
    this.startRun(runConfig);
  }

  startRun(runConfig, onComplete) {
    const initData = { runConfig, onComplete };
    const scene = this.game.scene.getScene('LoadingScene');
    if (scene) {
      scene.scene.restart(initData);
    } else {
      this.game.scene.start('LoadingScene', initData);
    }
  }

  stopGame() {
    const scene = this.game.scene.getScene('GameScene');
    if (scene) {
      if (scene.controller) scene.controller.shutdown();
      scene.scene.stop();
    }
  }
}
