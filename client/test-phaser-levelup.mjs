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

  await page.waitForTimeout(1000);

  // 直接给玩家加大量经验升级
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.player.addExp(500, g);
  });

  await page.waitForTimeout(500);

  const levelUpVisible = await page.locator('#levelUpPanel').isVisible().catch(() => false);
  const rewardCards = await page.locator('.reward-card').count().catch(() => 0);

  console.log('Level up panel visible:', levelUpVisible);
  console.log('Reward cards count:', rewardCards);

  await page.screenshot({ path: 'test-phaser-levelup.png' });

  // 选择第一个奖励
  if (levelUpVisible && rewardCards > 0) {
    await page.locator('.reward-card').first().click();
    await page.waitForTimeout(500);
  }

  const overlayClosed = await page.locator('#levelUpPanel').isHidden().catch(() => true);
  const playerLevel = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return scene.controller.player.level;
  });

  console.log('Overlay closed:', overlayClosed);
  console.log('Player level:', playerLevel);
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!levelUpVisible || rewardCards === 0 || !overlayClosed || playerLevel < 2 || errors.length > 0) {
    process.exit(1);
  }
})();
