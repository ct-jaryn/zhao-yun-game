import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('dialogue debug', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('triggers the dialogue box near Diaochan', async () => {
    await startStoryChapter(page, 1);

    await page.waitForFunction(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene && scene.controller && scene.controller.phaseManager && scene.controller.phaseManager.diaochan;
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      const dc = g.phaseManager.diaochan;
      if (dc) {
        g.player.x = dc.x - 80;
        g.player.y = dc.y;
        g.player.syncSprite();
      }
    });

    await page.waitForSelector('#dialogueBox', { state: 'visible', timeout: 5000 });
    const dialogueVisible = await isVisible(page, '#dialogueBox');
    expect(dialogueVisible).toBe(true);

    await safeScreenshot(page, { path: 'test-phaser-dialogue-debug.png' });
    expect(errors).toHaveLength(0);
  });
});
