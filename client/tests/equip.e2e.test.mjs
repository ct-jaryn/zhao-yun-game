import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible, isHidden } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('equip panel', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('opens and closes the equip panel', async () => {
    await startStoryChapter(page, 1);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.toggleEquipPanel();
    });

    await page.waitForSelector('#equipPanel', { state: 'visible', timeout: 5000 });
    const equipVisible = await isVisible(page, '#equipPanel');
    expect(equipVisible).toBe(true);

    const equipSlots = await page.locator('.equip-slot, .pause-equip-slot').count().catch(() => 0);
    expect(equipSlots).toBeGreaterThanOrEqual(5);

    await safeScreenshot(page, { path: 'test-phaser-equip.png' });

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.toggleEquipPanel();
    });

    await page.waitForSelector('#equipPanel', { state: 'hidden', timeout: 5000 });
    const equipClosed = await isHidden(page, '#equipPanel');
    expect(equipClosed).toBe(true);
    expect(errors).toHaveLength(0);
  });
});
