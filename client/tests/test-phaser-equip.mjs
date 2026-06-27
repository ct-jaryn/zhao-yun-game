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
  // 直接调用 toggleEquipPanel 打开装备面板
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.toggleEquipPanel();
  });

  await page.waitForTimeout(500);

  const equipVisible = await page.locator('#equipPanel').isVisible().catch(() => false);
  const equipSlots = await page.locator('.equip-slot, .pause-equip-slot').count().catch(() => 0);

  console.log('Equip panel visible:', equipVisible);
  console.log('Equip slot count:', equipSlots);

  await safeScreenshot(page, { path: 'test-phaser-equip.png' });

  // 关闭装备面板
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.toggleEquipPanel();
  });

  await page.waitForTimeout(500);

  const equipClosed = await page.locator('#equipPanel').isHidden().catch(() => true);

  console.log('Equip panel closed:', equipClosed);
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!equipVisible || equipSlots < 5 || !equipClosed || errors.length > 0) {
    process.exit(1);
  }
})();
