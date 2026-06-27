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

  // 直接让玩家死亡
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.player.takeDamage(99999);
  });

  await page.waitForTimeout(1000);

  const gameOverVisible = await page.locator('#gameOverScreen').isVisible().catch(() => false);
  const running = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return scene.controller.running;
  });
  const playerDead = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return scene.controller.player.dead;
  });

  console.log('Game over screen visible:', gameOverVisible);
  console.log('Game running:', running);
  console.log('Player dead:', playerDead);

  await safeScreenshot(page, { path: 'test-phaser-gameover.png' });

  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!gameOverVisible || running || !playerDead || errors.length > 0) {
    process.exit(1);
  }
})();
