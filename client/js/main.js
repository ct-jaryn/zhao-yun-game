import { Game } from './game.js';
import { initInput, keys as inputKeys, mouse as inputMouse } from './input.js';
import { resizeCanvas, canvas, ctx } from './utils.js';
import { fetchLeaderboard, fetchSave, saveGame, submitScore } from './api.js';
import { loadPlayerAssets } from './assets.js';

window.ctx = ctx;

let game = null;
let lastTime = 0;
let cam = { x: 0, y: 0 };
let keys = {};
let mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };

initInput(() => game, cam);

async function loadLeaderboard(elementId) {
  const res = await fetchLeaderboard(8);
  const el = document.getElementById(elementId);
  if (!res.ok || !res.data || res.data.length === 0) {
    el.innerHTML = '<div class="empty">暂无数据</div>';
    return;
  }
  el.innerHTML = '<ol>' + res.data.map((r, i) =>
    `<li><span class="lb-name">${i + 1}. ${r.name}</span><span class="lb-score">${r.score}</span></li>`
  ).join('') + '</ol>';
}

async function startGame(useSave = false) {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('waveAnnounce').style.display = 'none';
  document.getElementById('equipPanel').style.display = 'none';

  let savedData = null;
  if (useSave) {
    const res = await fetchSave();
    if (res.ok && res.data) savedData = res.data;
    else {
      alert('暂无存档');
      document.getElementById('startScreen').style.display = 'flex';
      return;
    }
  }

  game = new Game(savedData);
  keys = inputKeys;
  mouse = inputMouse;
  lastTime = performance.now();
}

document.getElementById('startBtn').addEventListener('click', () => startGame(false));
document.getElementById('loadBtn').addEventListener('click', () => startGame(true));
document.getElementById('restartBtn').addEventListener('click', () => startGame(false));

document.getElementById('saveBtn').addEventListener('click', async () => {
  if (!game || !game.running) return;
  const status = document.getElementById('saveStatus');
  const res = await saveGame(game.getSaveData());
  status.textContent = res.ok ? '已保存' : '保存失败';
  setTimeout(() => status.textContent = '', 2000);
});

document.getElementById('submitScoreBtn').addEventListener('click', async () => {
  if (!game) return;
  const nameInput = document.getElementById('playerName');
  const name = nameInput.value.trim() || '无名英雄';
  await submitScore({
    name,
    score: Math.floor(game.score),
    kills: game.totalKills,
    wave: game.wave,
    level: game.player.level,
    time: Math.floor(game.gameTime)
  });
  await loadLeaderboard('endLeaderboard');
  nameInput.value = '';
});

window.addEventListener('resize', () => {
  resizeCanvas();
  if (game) game.draw();
});

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  if (game) {
    game.update(dt, keys, mouse);
    game.draw();
    cam.x = game.cam.x;
    cam.y = game.cam.y;
  }
  requestAnimationFrame(loop);
}

resizeCanvas();
loadLeaderboard('startLeaderboard');
loadPlayerAssets();
requestAnimationFrame(loop);
