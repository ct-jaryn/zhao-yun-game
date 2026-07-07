import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible, isHidden } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('dialogue', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('triggers Diaochan dialogue and continues', async () => {
    await startStoryChapter(page, 1);

    // Wait for Diaochan to exist, then teleport nearby.
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

    const speaker = await page.locator('#dialogueSpeaker').textContent().catch(() => '');
    expect(speaker).toBe('貂蝉');

    await safeScreenshot(page, { path: 'test-phaser-dialogue.png' });

    await page.click('#dialogueContinue');
    await page.waitForSelector('#dialogueBox', { state: 'hidden', timeout: 5000 });

    const dialogueClosed = await isHidden(page, '#dialogueBox');
    expect(dialogueClosed).toBe(true);

    const gamePaused = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene.controller.paused;
    });
    expect(gamePaused).toBe(false);
    expect(errors).toHaveLength(0);
  });
});
