import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, waitForLobby, waitForGameScene } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

const TESTS = [
  { chapter: 1, skin: 'classic' },
  { chapter: 1, skin: 'mecha' },
  { chapter: 2, skin: 'classic' },
  { chapter: 3, skin: 'classic' },
  { chapter: 4, skin: 'classic' }
];

describe('full chapter/skin smoke tests', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
    await waitForLobby(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it.each(TESTS)('starts chapter $chapter with skin $skin', async ({ chapter, skin }) => {
    // Return to lobby and clear overlays.
    await page.evaluate(() => {
      if (window.lobbyController) window.lobbyController._returnToLobby();
      const ids = ['gameOverScreen', 'victoryScreen', 'pauseOverlay'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      }
    });
    await page.waitForFunction(() => {
      const lobby = document.getElementById('lobbyScreen');
      return lobby && window.getComputedStyle(lobby).display !== 'none';
    }, { timeout: 10000 });

    // Unlock target chapter.
    await page.evaluate((ch) => {
      if (window.lobbyController) {
        window.lobbyController.save.account.unlockChapter(ch);
        window.lobbyController.save.persist();
      }
    }, chapter);

    await page.click('.lobby-mode-btn[data-mode="story"]');
    await page.waitForSelector(`.lobby-chapter-card[data-chapter="${chapter}"]`, { state: 'visible', timeout: 10000 });
    await page.locator(`.lobby-chapter-card[data-chapter="${chapter}"]`).click();

    await page.evaluate((s) => {
      if (window.lobbyController) {
        window.lobbyController.save.heroes.getHero('zhaoyun').skin = s;
        window.lobbyController._renderPreview();
      }
    }, skin);

    await page.click('#lobbyStoryStart');
    await waitForGameScene(page);

    // Simulate brief input.
    await page.keyboard.down('w');
    await page.waitForTimeout(300);
    await page.keyboard.up('w');
    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.keyboard.press('k');
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => {
      const game = window.gameApp && window.gameApp.game;
      const scene = game && game.scene.getScene('GameScene');
      return {
        hasGame: !!game,
        hasScene: !!scene,
        playerAlive: !!(scene && scene.controller && scene.controller.player && !scene.controller.player.dead),
        enemyCount: scene ? scene.controller.enemies.length : -1,
        score: scene ? scene.controller.score : -1
      };
    });

    expect(state.hasGame).toBe(true);
    expect(state.hasScene).toBe(true);
    expect(state.playerAlive).toBe(true);

    try {
      await safeScreenshot(page, { path: `test-phaser-ch${chapter}-${skin}.png`, timeout: 5000 });
    } catch (e) {
      console.log(`Screenshot skipped for chapter=${chapter} skin=${skin}: ${e.message}`);
    }
  });
});
