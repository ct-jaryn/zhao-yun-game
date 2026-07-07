import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('direction hints', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('renders direction hints off-screen enemies', async () => {
    await startStoryChapter(page, 1);

    await page.waitForFunction(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene && scene.controller && scene.controller.enemies.length > 0;
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      g.player.x = 1500;
      g.player.y = 1000;
      g.player.syncSprite();

      g.enemies.forEach((e, i) => {
        e.x = 200 + i * 300;
        e.y = 100;
        e.syncSprite();
      });

      scene.cameras.main.stopFollow();
      scene.cameras.main.setScroll(900, 600);
      scene.cameras.main.setZoom(1);
      g.directionHints.update(g.enemies);
    });

    await page.waitForTimeout(500);
    await safeScreenshot(page, { path: 'test-phaser-hints.png' });

    const hintInfo = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      return {
        enemyCount: g.enemies.filter(e => !e.dead).length,
        cameraScroll: { x: scene.cameras.main.scrollX, y: scene.cameras.main.scrollY },
        graphicsVisible: g.directionHints.graphics.visible,
        graphicsAlpha: g.directionHints.graphics.alpha
      };
    });

    expect(hintInfo.enemyCount).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });
});
