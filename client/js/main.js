import { Game } from './game.js';
import { initInput, keys as inputKeys, mouse as inputMouse } from './input.js';
import { resizeCanvas, canvas, ctx } from './utils.js';
// 后端 API 已禁用
import { loadPlayerAssets } from './assets.js';

window.ctx = ctx;

let game = null;
let lastTime = 0;
let cam = { x: 0, y: 0 };
let keys = {};
let mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };

initInput(() => game, cam);

async function startGame(useSave = false) {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('victoryScreen').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('waveAnnounce').style.display = 'none';
  document.getElementById('equipPanel').style.display = 'none';

  // 后端已禁用，不再读取存档
  if (useSave) {
    alert('暂无存档（后端已禁用）');
    document.getElementById('startScreen').style.display = 'flex';
    return;
  }

  game = new Game(null);
  keys = inputKeys;
  mouse = inputMouse;
  lastTime = performance.now();
}

document.getElementById('startBtn').addEventListener('click', () => startGame(false));
// 读取存档按钮已禁用
document.getElementById('loadBtn').addEventListener('click', () => startGame(true));
document.getElementById('restartBtn').addEventListener('click', () => startGame(false));
document.getElementById('restartBtn2').addEventListener('click', () => startGame(false));

// 开始界面选项卡切换
function initStartTabs() {
  const tabs = document.querySelectorAll('.start-tab');
  const bodies = document.querySelectorAll('.start-panel-body');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      bodies.forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      const body = document.getElementById(`tab-${target}`);
      if (body) body.classList.add('active');
    });
  });
}
initStartTabs();

document.getElementById('saveBtn').addEventListener('click', async () => {
  if (!game || !game.running) return;
  const status = document.getElementById('saveStatus');
  status.textContent = '后端已禁用，无法保存';
  setTimeout(() => status.textContent = '', 2000);
});

function togglePause() {
  if (!game || !game.running || game.levelUpOpen) return;
  game.paused = !game.paused;
  document.getElementById('pauseOverlay').style.display = game.paused ? 'flex' : 'none';
  // 继续游戏时自动关闭装备面板
  if (!game.paused && game.equipPanelOpen) {
    game.equipPanelOpen = false;
    document.getElementById('equipPanel').style.display = 'none';
  }
}

document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resumeBtn').addEventListener('click', togglePause);

document.getElementById('viewEquipBtn').addEventListener('click', () => {
  if (!game || !game.running || game.levelUpOpen) return;
  game.equipPanelOpen = true;
  document.getElementById('equipPanel').style.display = 'block';
  game.ui.updateEquipPanel();
});

document.getElementById('submitScoreBtn').addEventListener('click', async () => {
  if (!game) return;
  alert('排行榜功能已禁用（后端已关闭）');
});

document.getElementById('submitWinScoreBtn').addEventListener('click', async () => {
  if (!game) return;
  alert('排行榜功能已禁用（后端已关闭）');
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
// 排行榜已禁用
const lb = document.getElementById('startLeaderboard');
if (lb) lb.innerHTML = '<div class="empty">排行榜已禁用</div>';
const elb = document.getElementById('endLeaderboard');
if (elb) elb.innerHTML = '<div class="empty">排行榜已禁用</div>';
loadPlayerAssets();
requestAnimationFrame(loop);
