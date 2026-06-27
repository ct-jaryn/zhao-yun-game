import { chromium } from 'playwright';
import { startStoryChapter } from './game-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];

  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('GPU stall') || text.includes('ReadPixels')) return;
    if (type === 'error' && (text.includes('401') || text.includes('ERR_CONNECTION_CLOSED') || text.includes('ERR_CONNECTION_REFUSED') || text.includes('ERR_NETWORK_IO_SUSPENDED') || text.includes('Failed to process file'))) return;
    if (type === 'error') errors.push(`CONSOLE ERROR: ${text}`);
  });

  await startStoryChapter(page, 1);
  await page.waitForTimeout(1000);

  // 设置各种 HUD 状态
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    const p = g.player;

    // 连击 15，给一个较长倒计时避免截图超时期间中断
    p.combo = 15;
    p.comboTimer = 60;

    // 闪避 CD 1.5 秒
    p.dodgeCd = 1.5;

    // 清兵阶段进度 8/20
    g.phaseManager.soldierKills = 8;

    // 低血量
    p.hp = 20;

    // 附近掉落（放在 75 距离处，避免被自动拾取且能被 checkNearestDrop 检测到）
    const drop = g.dropManager.spawnDrop(p.x + 75, p.y, p.level);
    g.dropManager.checkNearestDrop();
  });

  await page.waitForTimeout(500);

  const hudState = await page.evaluate(() => {
    return {
      comboVisible: window.getComputedStyle(document.getElementById('comboDisplay')).display !== 'none',
      comboNum: document.getElementById('comboNum').textContent,
      waveCountdownVisible: document.querySelector('#scorePanel .wave-countdown').classList.contains('active'),
      waveCountdownText: document.getElementById('waveCountdown').textContent,
      dodgeReady: document.getElementById('dodgeIcon').classList.contains('ready'),
      dodgeCdText: document.querySelector('#dodgeIcon .dodge-cd') ? document.querySelector('#dodgeIcon .dodge-cd').textContent : '',
      pickupHintVisible: window.getComputedStyle(document.getElementById('pickupHint')).display !== 'none',
      pickupHintName: document.getElementById('phName').textContent,
      lowHpWarning: document.getElementById('lowHpWarning').classList.contains('danger')
    };
  });

  console.log('HUD state:', hudState);

  await safeScreenshot(page, { path: 'test-phaser-hud.png', timeout: 5000 });

  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  const ok = hudState.comboVisible && hudState.comboNum === '15' &&
    hudState.waveCountdownVisible && hudState.waveCountdownText === '8/20' &&
    !hudState.dodgeReady && hudState.dodgeCdText !== '' &&
    hudState.pickupHintVisible && hudState.pickupHintName !== '' &&
    hudState.lowHpWarning;

  if (!ok || errors.length > 0) {
    process.exit(1);
  }
})();
