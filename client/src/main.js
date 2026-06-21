import { GameApp } from './phaser/GameApp.js';
import { UIBridge } from './phaser/UIBridge.js';

function initStartParticles() {
  const bgCanvas = document.getElementById('bgParticles');
  if (!bgCanvas) return;
  const bgCtx = bgCanvas.getContext('2d');

  function resize() {
    const container = bgCanvas.parentElement;
    if (!container) return;
    bgCanvas.width = container.clientWidth;
    bgCanvas.height = container.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const count = 90;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      vx: (Math.random() - 0.3) * 0.4,
      vy: (Math.random() * -0.5) - 0.1,
      size: Math.random() * 2.2 + 0.4,
      alpha: Math.random() * 0.6 + 0.1,
      fade: Math.random() * 0.01 + 0.003,
      color: Math.random() > 0.7 ? '255,200,80' : '255,120,60'
    });
  }

  let frame = 0;
  function animate() {
    const startScreen = document.getElementById('startScreen');
    if (!startScreen || startScreen.style.display === 'none') {
      requestAnimationFrame(animate);
      return;
    }
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    frame++;

    for (const p of particles) {
      p.x += p.vx + Math.sin(frame * 0.005 + p.y * 0.01) * 0.15;
      p.y += p.vy;
      p.alpha -= p.fade;

      if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > bgCanvas.width + 10) {
        p.x = Math.random() * bgCanvas.width;
        p.y = bgCanvas.height + Math.random() * 40;
        p.vx = (Math.random() - 0.3) * 0.4;
        p.vy = (Math.random() * -0.5) - 0.1;
        p.alpha = Math.random() * 0.6 + 0.15;
        p.size = Math.random() * 2.2 + 0.4;
      }

      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      bgCtx.shadowBlur = 6;
      bgCtx.shadowColor = `rgba(${p.color}, ${p.alpha * 0.8})`;
      bgCtx.fill();
    }
    bgCtx.shadowBlur = 0;
    requestAnimationFrame(animate);
  }
  animate();
}

window.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = '资源加载中...';
  }

  initStartParticles();

  const app = new GameApp();
  window.gameApp = app;

  window.addEventListener('phaserAssetsReady', () => {
    window.uiBridge = new UIBridge(app);
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = '※ 开始征战';
    }
  }, { once: true });
});
