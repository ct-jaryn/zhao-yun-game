import Phaser from 'phaser';

// Phaser 3 的 KeyCodes 使用传统 keyCode 常量名，而非 DOM event.code
const CODE_MAP = {
  'ArrowLeft': 'LEFT',
  'ArrowRight': 'RIGHT',
  'ArrowUp': 'UP',
  'ArrowDown': 'DOWN',
  'KeyW': 'W',
  'KeyA': 'A',
  'KeyS': 'S',
  'KeyD': 'D',
  'KeyJ': 'J',
  'KeyK': 'K',
  'KeyL': 'L',
  'KeyU': 'U',
  'KeyI': 'I',
  'Space': 'SPACE',
  'Tab': 'TAB',
  'Escape': 'ESC'
};

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.keys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, rightDown: false };
    this.mouseAim = false;
    this.setupKeyboard();
    this.setupMouse();
  }

  setupKeyboard() {
    const keyCodes = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyI',
      'Space', 'Tab', 'Escape'
    ];
    keyCodes.forEach(code => {
      const phaserCode = CODE_MAP[code] || code;
      const keyCode = Phaser.Input.Keyboard.KeyCodes[phaserCode];
      if (keyCode !== undefined) {
        this.keys[code] = this.scene.input.keyboard.addKey(keyCode);
      }
    });
  }

  setupMouse() {
    if (this.scene.input.mouse) {
      this.scene.input.mouse.disableContextMenu();
    }

    this._onPointerMove = pointer => {
      this.mouse.x = pointer.x;
      this.mouse.y = pointer.y;
      this.mouse.worldX = pointer.worldX;
      this.mouse.worldY = pointer.worldY;

      if (this.mouse.down) {
        this.mouseAim = true;
      }
    };

    this._onPointerDown = pointer => {
      if (pointer.leftButtonDown()) {
        this.mouse.down = true;
        this.mouseAim = true;
      }
      if (pointer.rightButtonDown()) {
        this.mouse.rightDown = true;
      }
    };

    this._onPointerUp = pointer => {
      if (!pointer.leftButtonDown()) {
        this.mouse.down = false;
        this.mouseAim = false;
      }
      if (!pointer.rightButtonDown()) {
        this.mouse.rightDown = false;
      }
    };

    this.scene.input.on('pointermove', this._onPointerMove);
    this.scene.input.on('pointerdown', this._onPointerDown);
    this.scene.input.on('pointerup', this._onPointerUp);
  }

  isDown(code) {
    return this.keys[code] && this.keys[code].isDown;
  }

  justDown(code) {
    return this.keys[code] && Phaser.Input.Keyboard.JustDown(this.keys[code]);
  }

  update() {
    // 鼠标世界坐标由 Phaser 相机自动维护
  }

  destroy() {
    if (this.scene.input.keyboard) {
      for (const key of Object.values(this.keys)) {
        if (key && key.destroy) key.destroy();
      }
      this.keys = {};
    }

    if (this._onPointerMove) {
      this.scene.input.off('pointermove', this._onPointerMove);
      this.scene.input.off('pointerdown', this._onPointerDown);
      this.scene.input.off('pointerup', this._onPointerUp);
    }

    this.scene = null;
  }
}
