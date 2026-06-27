import { chromium } from 'playwright';
import { waitForLobby } from './game-helper.mjs';
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
    if (type === 'error' && (text.includes('401') || text.includes('500') || text.includes('ERR_CONNECTION_CLOSED') || text.includes('ERR_CONNECTION_REFUSED') || text.includes('ERR_NETWORK_IO_SUSPENDED') || text.includes('Failed to process file'))) return;
    if (type === 'error') errors.push(`CONSOLE ERROR: ${text}`);
  });

  await waitForLobby(page);

  // 重置存档，确保第四章未解锁
  await page.evaluate(() => {
    try {
      localStorage.removeItem('zhaoyun_save');
      localStorage.removeItem('zhaoyun_chapter4_unlocked');
    } catch (e) {}
    if (window.lobbyController) {
      window.lobbyController.save.resetAll();
      window.lobbyController.render();
    }
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForLobby(page);

  await page.click('.lobby-mode-btn[data-mode="story"]');
  await page.waitForTimeout(300);

  const locked = await page.evaluate(() => {
    const card = document.querySelector('.lobby-chapter-card[data-chapter="4"]');
    return card && card.classList.contains('locked');
  });
  console.log('Chapter 4 locked initially:', locked);

  await safeScreenshot(page, { path: 'test-phaser-adlock.png' });

  // 锁定状态下点击不应选中
  await page.locator('.lobby-chapter-card[data-chapter="4"]').click();
  await page.waitForTimeout(300);
  const stillLocked = await page.evaluate(() => {
    const card = document.querySelector('.lobby-chapter-card[data-chapter="4"]');
    return card && card.classList.contains('locked') && !card.classList.contains('active');
  });
  console.log('Chapter 4 still locked after click:', stillLocked);

  // 通过存档解锁第四章
  await page.evaluate(() => {
    if (window.lobbyController) {
      window.lobbyController.save.account.unlockChapter(4);
      window.lobbyController.save.persist();
    }
  });

  // 重新打开剧情对话框刷新状态
  await page.click('#lobbyStoryCancel').catch(() => {});
  await page.waitForTimeout(200);
  await page.click('.lobby-mode-btn[data-mode="story"]');
  await page.waitForTimeout(300);

  const unlocked = await page.evaluate(() => {
    const card = document.querySelector('.lobby-chapter-card[data-chapter="4"]');
    return card && !card.classList.contains('locked');
  });
  console.log('Chapter 4 unlocked after unlock:', unlocked);

  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!locked || !stillLocked || !unlocked || errors.length > 0) {
    process.exit(1);
  }
})();
