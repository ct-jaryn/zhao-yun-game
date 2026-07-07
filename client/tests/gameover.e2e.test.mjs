import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('game over', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('shows the game over screen when player dies', async () => {
    await startStoryChapter(page, 1);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      g.player.takeDamage(99999);
    });

    await page.waitForSelector('#gameOverScreen', { state: 'visible', timeout: 5000 });
    const gameOverVisible = await isVisible(page, '#gameOverScreen');
    expect(gameOverVisible).toBe(true);

    const running = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene.controller.running;
    });
    expect(running).toBe(false);

    const playerDead = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene.controller.player.dead;
    });
    expect(playerDead).toBe(true);

    await safeScreenshot(page, { path: 'test-phaser-gameover.png' });
    expect(errors).toHaveLength(0);
  });
});
