import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('victory only', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('shows victory screen after defeating final bosses in chapter 2', async () => {
    await startStoryChapter(page, 2);

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      g.phaseManager.spawnFinalBosses();
    });

    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      const bosses = g.enemies.filter(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type));
      for (const boss of bosses) {
        boss.takeDamage(99999, false, 0, g);
      }
    });

    await page.waitForSelector('#victoryScreen', { state: 'visible', timeout: 5000 });
    const victoryVisible = await isVisible(page, '#victoryScreen');
    expect(victoryVisible).toBe(true);

    const finalKills = await page.locator('#finalKills').textContent({ timeout: 5000 }).catch(() => '0');
    expect(finalKills).toBeTruthy();

    const running = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene.controller.running;
    });
    expect(running).toBe(false);

    await safeScreenshot(page, { path: 'test-phaser-victory.png' });
    expect(errors).toHaveLength(0);
  });
});
