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

  // 将玩家移到地图中央，敌人移到远处，固定相机
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.player.x = 1500;
    g.player.y = 1000;
    g.player.syncSprite();

    // 把所有敌人移到屏幕外远处
    g.enemies.forEach((e, i) => {
      e.x = 200 + i * 300;
      e.y = 100;
      e.syncSprite();
    });

    // 禁用相机跟随并固定滚动
    scene.cameras.main.stopFollow();
    scene.cameras.main.setScroll(900, 600);
    scene.cameras.main.setZoom(1);

    // 强制更新方向指示器
    g.directionHints.update(g.enemies);
  });

  await page.waitForTimeout(500);
  await safeScreenshot(page, { path: 'test-phaser-hints.png' });

  const hintInfo = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    return {
      enemyCount: g.enemies.filter(e => !e.dead).length,
      cameraScroll: { x: scene.cameras.main.scrollX, y: scene.cameras.main.scrollY },
      graphicsVisible: g.directionHints.graphics.visible,
      graphicsAlpha: g.directionHints.graphics.alpha
    };
  });

  console.log('Hint info:', hintInfo);
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (hintInfo.enemyCount === 0 || errors.length > 0) {
    process.exit(1);
  }
})();
