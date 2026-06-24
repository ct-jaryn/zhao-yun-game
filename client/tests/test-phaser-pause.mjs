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

  await page.click('canvas');
  await page.waitForTimeout(1000);

  // 长按 Escape 暂停
  await page.keyboard.down('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.up('Escape');
  await page.waitForTimeout(500);

  const pauseVisible = await page.locator('#pauseOverlay').isVisible().catch(() => false);
  const paused = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return scene.controller.paused;
  });

  console.log('Pause panel visible:', pauseVisible);
  console.log('Game paused:', paused);

  await page.screenshot({ path: 'test-phaser-pause.png' });

  // 恢复游戏
  await page.click('#resumeBtn');
  await page.waitForTimeout(500);

  const resumed = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return !scene.controller.paused;
  });

  console.log('Game resumed:', resumed);
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!pauseVisible || !paused || !resumed || errors.length > 0) {
    process.exit(1);
  }
})();
