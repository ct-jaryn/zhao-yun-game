import { chromium } from 'playwright';
import { safeScreenshot } from './screenshot-helper.mjs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];

  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type}]`, text);
    // 忽略 WebGL 性能警告、字体/资源 401、网络连接错误、以及损坏图片的内部处理错误
    if (text.includes('GPU stall') || text.includes('ReadPixels')) return;
    if (type === 'error' && text.includes('401')) return;
    if (type === 'error' && (text.includes('ERR_CONNECTION_CLOSED') || text.includes('ERR_CONNECTION_REFUSED') || text.includes('ERR_NETWORK_IO_SUSPENDED'))) return;
    if (type === 'error' && text.includes('Failed to process file')) return;
    if (type === 'error') {
      errors.push(`CONSOLE ERROR: ${text}`);
    }
  });

  await page.goto('http://localhost:5177/', { waitUntil: 'domcontentloaded' });

  // 等待大厅加载完成
  await page.waitForFunction(() => {
    const lobby = document.getElementById('lobbyScreen');
    return lobby && window.getComputedStyle(lobby).display !== 'none';
  }, { timeout: 60000 });

  // 检查 Vite 错误覆盖层
  const overlay = await page.locator('vite-error-overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    const text = await overlay.textContent();
    console.error('Vite error overlay:', text);
    await safeScreenshot(page, { path: 'test-phaser-error.png' });
    await browser.close();
    process.exit(1);
  }

  const canvas = await page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  await safeScreenshot(page, { path: 'test-phaser-lobby.png' });

  // 检查核心对象
  const lobbyInfo = await page.evaluate(() => ({
    hasGameApp: !!window.gameApp,
    hasBridge: !!window.uiBridge,
    hasLobby: !!window.lobbyController,
    lobbyDisplay: window.getComputedStyle(document.getElementById('lobbyScreen')).display
  }));
  console.log('Lobby loaded:', lobbyInfo);

  // 点击剧情模式按钮
  await page.click('.lobby-mode-btn[data-mode="story"]');
  await page.waitForTimeout(300);

  // 选择第一章
  await page.locator('.lobby-chapter-card[data-chapter="1"]').click();
  await page.waitForTimeout(200);

  // 点击开始战斗
  await page.click('#lobbyStoryStart');
  await page.waitForTimeout(5000);

  await safeScreenshot(page, { path: 'test-phaser-ingame.png' });

  // 模拟按键移动，验证输入与玩家更新
  await page.keyboard.down('d');
  await page.waitForTimeout(800);
  await page.keyboard.up('d');
  await page.waitForTimeout(200);
  await safeScreenshot(page, { path: 'test-phaser-move.png' });

  // 检查 Phaser 是否创建了动态 canvas 内容（通过 JS）
  const phaserReady = await page.evaluate(() => {
    return !!window.gameApp && !!window.gameApp.game;
  });

  console.log('Canvas bounding box:', box);
  console.log('Phaser ready:', phaserReady);
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (errors.length > 0 || !phaserReady) {
    process.exit(1);
  }
})();
