import { chromium } from 'playwright';

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

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  const overlay = await page.locator('vite-error-overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    const text = await overlay.textContent();
    console.error('Vite error overlay:', text);
    await browser.close();
    process.exit(1);
  }

  await page.waitForFunction(() => {
    const btn = document.getElementById('startBtn');
    return btn && !btn.disabled;
  }, { timeout: 60000 });

  await page.click('#startBtn');
  await page.waitForTimeout(300);
  await page.locator('.chapter-card[data-chapter="1"]').click();
  await page.waitForTimeout(300);
  await page.locator('.skin-card[data-skin="classic"]').click();
  await page.waitForTimeout(200);
  await page.click('#skinStartBtn');

  await page.waitForFunction(() => {
    const scene = window.gameApp && window.gameApp.game.scene.getScene('GameScene');
    return scene && scene.controller && scene.controller.player;
  }, { timeout: 30000 });

  await page.waitForTimeout(1000);

  // 设置各种 HUD 状态
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    const p = g.player;

    // 连击 15
    p.combo = 15;
    p.comboTimer = 2;

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
  await page.screenshot({ path: 'test-phaser-hud.png' });

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
