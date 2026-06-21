import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { GameScene } from './scenes/GameScene.js';

export class GameApp {
  constructor() {
    const canvas = document.getElementById('gameCanvas');
    const parent = document.getElementById('gameContainer');

    this.config = {
      type: Phaser.CANVAS,
      width: 1000,
      height: 700,
      canvas,
      parent,
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [BootScene, PreloadScene, GameScene],
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
    const scene = this.game.scene.getScene('GameScene');
    if (scene) {
      scene.startChapter(chapter, skin);
    }
  }
}
