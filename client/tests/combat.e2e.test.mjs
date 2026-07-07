import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('combat', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('spawns enemies and lets the player fight', async () => {
    await startStoryChapter(page, 1);

    // Wait for enemies to spawn.
    await page.waitForFunction(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene && scene.controller && scene.controller.enemies.length > 0;
    }, { timeout: 10000 });

    // Teleport to first enemy and attack repeatedly.
    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      const p = g.player;
      const target = g.enemies.find(e => !e.dead);
      if (target) {
        p.x = target.x + 60;
        p.y = target.y;
        p.dir = Math.atan2(target.y - p.y, target.x - p.x);
        p.syncSprite();
      }
    });

    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        const scene = window.gameApp.game.scene.getScene('GameScene');
        const g = scene.controller;
        const p = g.player;
        const target = g.enemies.find(e => !e.dead);
        if (target) {
          p.dir = Math.atan2(target.y - p.y, target.x - p.x);
          p.useSkill(0, g);
        }
      });
      await page.waitForTimeout(250);
    }

    await safeScreenshot(page, { path: 'test-phaser-combat.png' });

    const state = await page.evaluate(() => {
      const scene = window.gameApp && window.gameApp.game.scene.getScene('GameScene');
      if (!scene || !scene.controller) return null;
      const g = scene.controller;
      return {
        playerAlive: !g.player.dead,
        level: g.player.level,
        kills: g.totalKills,
        score: g.score,
        phase: g.getPhaseName(),
        enemyCount: g.enemies.length,
        dropCount: g.dropManager.drops.length
      };
    });

    expect(state).toBeTruthy();
    expect(state.playerAlive).toBe(true);
    expect(errors).toHaveLength(0);
  });
});
