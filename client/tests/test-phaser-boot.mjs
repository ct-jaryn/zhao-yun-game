import { chromium } from 'playwright';

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

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  // 等待资源加载完成，开始按钮可用
  await page.waitForFunction(() => {
    const btn = document.getElementById('startBtn');
    return btn && !btn.disabled;
  }, { timeout: 60000 });

  // 检查 Vite 错误覆盖层
  const overlay = await page.locator('vite-error-overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    const text = await overlay.textContent();
    console.error('Vite error overlay:', text);
    await page.screenshot({ path: 'test-phaser-error.png' });
    await browser.close();
    process.exit(1);
  }

  const canvas = await page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  await page.screenshot({ path: 'test-phaser-boot.png' });

  // 点击进入章节选择
  const bridgeInfo = await page.evaluate(() => ({
    hasGameApp: !!window.gameApp,
    hasBridge: !!window.uiBridge,
    startBtnDisabled: document.getElementById('startBtn').disabled,
    startBtnText: document.getElementById('startBtn').textContent,
    chapterDisplay: window.getComputedStyle(document.getElementById('chapterScreen')).display,
    startDisplay: window.getComputedStyle(document.getElementById('startScreen')).display
  }));
  console.log('Before click:', bridgeInfo);

  await page.click('#startBtn');
  await page.waitForTimeout(500);

  const afterClick = await page.evaluate(() => ({
    chapterDisplay: window.getComputedStyle(document.getElementById('chapterScreen')).display,
    startDisplay: window.getComputedStyle(document.getElementById('startScreen')).display
  }));
  console.log('After click:', afterClick);

  // 点击第一章
  await page.locator('.chapter-card[data-chapter="1"]').click();
  await page.waitForTimeout(500);

  // 选择经典皮肤并开始
  await page.locator('.skin-card[data-skin="classic"]').click();
  await page.waitForTimeout(200);
  await page.click('#skinStartBtn');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'test-phaser-ingame.png' });

  // 模拟按键移动，验证输入与玩家更新
  await page.keyboard.down('d');
  await page.waitForTimeout(800);
  await page.keyboard.up('d');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'test-phaser-move.png' });

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
