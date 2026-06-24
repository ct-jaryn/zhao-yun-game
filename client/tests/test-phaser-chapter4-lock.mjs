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
    if (type === 'error' && (text.includes('401') || text.includes('500') || text.includes('ERR_CONNECTION_CLOSED') || text.includes('ERR_CONNECTION_REFUSED') || text.includes('ERR_NETWORK_IO_SUSPENDED') || text.includes('Failed to process file'))) return;
    if (type === 'error') errors.push(`CONSOLE ERROR: ${text}`);
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const btn = document.getElementById('startBtn');
    return btn && !btn.disabled;
  }, { timeout: 60000 });

  // 清除解锁状态
  await page.evaluate(() => {
    try {
      localStorage.removeItem('zhaoyun_chapter4_unlocked');
    } catch (e) {}
  });

  await page.click('#startBtn');
  await page.waitForTimeout(500);

  const locked = await page.evaluate(() => {
    const card = document.querySelector('.chapter-card[data-chapter="4"]');
    return card && card.classList.contains('locked');
  });

  console.log('Chapter 4 locked initially:', locked);

  // 点击第四章，应弹出广告锁
  await page.locator('.chapter-card[data-chapter="4"]').click();
  await page.waitForTimeout(500);

  const adVisible = await page.locator('#adLockOverlay').isVisible().catch(() => false);
  console.log('Ad lock visible:', adVisible);

  await page.screenshot({ path: 'test-phaser-adlock.png' });

  // 返回
  await page.click('#adBackBtn');
  await page.waitForTimeout(500);

  // 直接解锁（模拟看完广告）
  await page.evaluate(() => {
    if (window.uiBridge) {
      window.uiBridge.unlockChapter4();
      window.uiBridge.updateChapterLockState();
    }
  });

  const unlocked = await page.evaluate(() => {
    const card = document.querySelector('.chapter-card[data-chapter="4"]');
    return card && !card.classList.contains('locked');
  });

  console.log('Chapter 4 unlocked after unlock:', unlocked);

  // 点击第四章，应进入皮肤选择
  await page.locator('.chapter-card[data-chapter="4"]').click();
  await page.waitForTimeout(500);

  const skinVisible = await page.locator('#skinScreen').isVisible().catch(() => false);
  console.log('Skin screen visible:', skinVisible);

  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!locked || !adVisible || !unlocked || !skinVisible || errors.length > 0) {
    process.exit(1);
  }
})();
