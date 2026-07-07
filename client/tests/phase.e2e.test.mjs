import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('phase progression', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('spawns mid boss, defeats it and enters final phase', async () => {
    await startStoryChapter(page, 2);

    // Wait for scene to settle before forcing boss spawn.
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      g.phaseManager.spawnBoss();
    });

    await page.waitForTimeout(1000);

    const state1 = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      return {
        phase: g.getPhaseName(),
        bossCount: g.enemies.filter(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type)).length
      };
    });
    expect(state1.phase).toBe('典韦');
    expect(state1.bossCount).toBeGreaterThanOrEqual(1);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      const boss = g.enemies.find(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type));
      if (boss) {
        g.player.x = boss.x + 80;
        g.player.y = boss.y;
        g.player.dir = Math.atan2(boss.y - g.player.y, boss.x - g.player.x);
        boss.takeDamage(99999, false, 0, g);
      }
    });

    await page.waitForTimeout(1000);

    const state2 = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      return {
        phase: g.getPhaseName(),
        midBossDefeated: g.phaseManager.midBossDefeated,
        playerLevel: g.player.level,
        dropCount: g.dropManager.drops.length
      };
    });
    expect(state2.midBossDefeated).toBe(true);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      g.phaseManager.spawnFinalBosses();
    });

    await page.waitForTimeout(1000);

    const state3 = await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      return {
        phase: g.getPhaseName(),
        finalBossCount: g.enemies.filter(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type)).length
      };
    });
    expect(state3.phase).toBe('曹操·狂暴 & 典韦');
    expect(state3.finalBossCount).toBeGreaterThanOrEqual(2);

    await safeScreenshot(page, { path: 'test-phaser-phase.png' });
    expect(errors).toHaveLength(0);
  });
});
