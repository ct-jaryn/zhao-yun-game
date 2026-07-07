import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible, isHidden } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('level up', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('shows level up rewards and applies the selected one', async () => {
    await startStoryChapter(page, 1);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      g.player.addExp(500, g);
    });

    await page.waitForSelector('#levelUpPanel', { state: 'visible', timeout: 5000 });
    const levelUpVisible = await isVisible(page, '#levelUpPanel');
    expect(levelUpVisible).toBe(true);

    const rewardCards = await page.locator('.reward-card').count().catch(() => 0);
    expect(rewardCards).toBeGreaterThan(0);

    await safeScreenshot(page, { path: 'test-phaser-levelup.png' });

    await page.locator('.reward-card').first().click();
    await page.waitForSelector('#levelUpPanel', { state: 'hidden', timeout: 5000 });

    const overlayClosed = await isHidden(page, '#levelUpPanel');
    expect(overlayClosed).toBe(true);

    const playerLevel = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene.controller.player.level;
    });
    expect(playerLevel).toBeGreaterThanOrEqual(2);
    expect(errors).toHaveLength(0);
  });
});
