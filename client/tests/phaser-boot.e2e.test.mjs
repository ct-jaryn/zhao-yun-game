import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('phaser boot', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('loads lobby and starts a chapter', async () => {
    await startStoryChapter(page, 1);

    const canvas = await page.locator('#gameCanvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    await safeScreenshot(page, { path: 'test-phaser-lobby.png' });
    await safeScreenshot(page, { path: 'test-phaser-ingame.png' });

    // Simulate movement.
    await page.keyboard.down('d');
    await page.waitForTimeout(800);
    await page.keyboard.up('d');
    await page.waitForTimeout(200);
    await safeScreenshot(page, { path: 'test-phaser-move.png' });

    const phaserReady = await page.evaluate(() => {
      return !!window.gameApp && !!window.gameApp.game;
    });
    expect(phaserReady).toBe(true);
    expect(errors).toHaveLength(0);
  });
});
