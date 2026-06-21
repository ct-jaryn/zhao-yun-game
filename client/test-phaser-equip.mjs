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

  await page.screenshot({ path: 'test-phaser-equip.png' });

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
