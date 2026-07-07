import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, waitForLobby, isVisible } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('chapter 4 lock', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('locks chapter 4 until unlocked via save', async () => {
    await startStoryChapter(page, 1);

    // Reset save to ensure chapter 4 is locked.
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
    await page.waitForSelector('.lobby-chapter-card[data-chapter="4"]', { state: 'visible', timeout: 10000 });

    const locked = await page.evaluate(() => {
      const card = document.querySelector('.lobby-chapter-card[data-chapter="4"]');
      return card && card.classList.contains('locked');
    });
    expect(locked).toBe(true);

    await page.locator('.lobby-chapter-card[data-chapter="4"]').click();
    const stillLocked = await page.evaluate(() => {
      const card = document.querySelector('.lobby-chapter-card[data-chapter="4"]');
      return card && card.classList.contains('locked') && !card.classList.contains('active');
    });
    expect(stillLocked).toBe(true);

    await safeScreenshot(page, { path: 'test-phaser-adlock.png' });

    // Unlock chapter 4.
    await page.evaluate(() => {
      if (window.lobbyController) {
        window.lobbyController.save.account.unlockChapter(4);
        window.lobbyController.save.persist();
      }
    });

    await page.click('#lobbyStoryCancel').catch(() => {});
    await page.waitForTimeout(200);
    await page.click('.lobby-mode-btn[data-mode="story"]');
    await page.waitForSelector('.lobby-chapter-card[data-chapter="4"]', { state: 'visible', timeout: 10000 });

    const unlocked = await page.evaluate(() => {
      const card = document.querySelector('.lobby-chapter-card[data-chapter="4"]');
      return card && !card.classList.contains('locked');
    });
    expect(unlocked).toBe(true);
    expect(errors).toHaveLength(0);
  });
});
