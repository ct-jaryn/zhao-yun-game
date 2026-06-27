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

  // 通过控制器触发暂停（Playwright 键盘事件在 Phaser 中不一定被识别）
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.togglePause();
  });
  await page.waitForTimeout(500);

  const pauseVisible = await page.locator('#pauseOverlay').isVisible().catch(() => false);
  const paused = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return scene.controller.paused;
  });

  console.log('Pause panel visible:', pauseVisible);
  console.log('Game paused:', paused);

  await safeScreenshot(page, { path: 'test-phaser-pause.png' });

  // 恢复游戏
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.togglePause();
  });
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
