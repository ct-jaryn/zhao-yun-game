import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible, isHidden } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('pause', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('toggles pause overlay and game state', async () => {
    await startStoryChapter(page, 1);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.togglePause();
    });

    await page.waitForSelector('#pauseOverlay', { state: 'visible', timeout: 5000 });
    const pauseVisible = await isVisible(page, '#pauseOverlay');
    expect(pauseVisible).toBe(true);

    const paused = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene.controller.paused;
    });
    expect(paused).toBe(true);

    await safeScreenshot(page, { path: 'test-phaser-pause.png' });

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.togglePause();
    });

    await page.waitForSelector('#pauseOverlay', { state: 'hidden', timeout: 5000 });
    const resumed = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return !scene.controller.paused;
    });
    expect(resumed).toBe(true);
    expect(errors).toHaveLength(0);
  });
});
