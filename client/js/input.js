import { screenToWorld } from './utils.js';

export const keys = {};
export const mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, rightDown: false };

export function initInput(getGame, cam) {
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    const game = getGame();
    handleKey(e, game);
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  const canvas = document.getElementById('gameCanvas');

  canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const w = screenToWorld(e.clientX, e.clientY, cam);
    mouse.worldX = w.x;
    mouse.worldY = w.y;
  });

  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) {
      mouse.down = true;
      const game = getGame();
      if (game && game.running && !game.paused) {
        game.player.mouseAim = true;
      }
    }
    if (e.button === 2) mouse.rightDown = true;
  });

  canvas.addEventListener('mouseup', e => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('click', e => {
    const game = getGame();
    if (game && game.running && !game.paused && game.player) {
      const w = screenToWorld(e.clientX, e.clientY, cam);
      game.player.moveTarget = { x: w.x, y: w.y };
    }
  });
}

function handleKey(e, game) {
  if (e.code === 'Escape') {
    e.preventDefault();
    if (game && game.levelUpOpen) return;
    if (game && game.equipPanelOpen) {
      game.equipPanelOpen = false;
      document.getElementById('equipPanel').style.display = 'none';
      return;
    }
    if (game && game.running) {
      game.paused = !game.paused;
      document.getElementById('pauseOverlay').style.display = game.paused ? 'flex' : 'none';
    }
    return;
  }

  if (e.code === 'Tab') {
    e.preventDefault();
    if (!game || !game.running || game.paused || game.levelUpOpen) return;
    game.equipPanelOpen = !game.equipPanelOpen;
    document.getElementById('equipPanel').style.display = game.equipPanelOpen ? 'block' : 'none';
    if (game.equipPanelOpen) game.ui.updateEquipPanel();
    return;
  }

  if (!game || !game.running || game.paused || game.levelUpOpen) return;

  switch (e.code) {
    case 'KeyJ': game.player.useSkill(0, game); break;
    case 'KeyK': game.player.useSkill(1, game); break;
    case 'KeyL': game.player.useSkill(2, game); break;
    case 'KeyU': game.player.useSkill(3, game); break;
    case 'KeyI': game.player.useSkill(4, game); break;
    case 'Space': game.player.dodge(game); e.preventDefault(); break;
    case 'KeyE': game.pickupDrop(); break;
  }
}
