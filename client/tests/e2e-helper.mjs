import { chromium } from 'playwright';

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5177/';

export async function setupBrowser() {
  return chromium.launch({ headless: true });
}

export async function teardown(browser) {
  if (browser) await browser.close();
}

export function collectErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('GPU stall') || text.includes('ReadPixels')) return;
    if (type === 'error' && (text.includes('401') || text.includes('ERR_CONNECTION_CLOSED') || text.includes('ERR_CONNECTION_REFUSED') || text.includes('ERR_NETWORK_IO_SUSPENDED') || text.includes('Failed to process file'))) return;
    if (type === 'error') errors.push(`CONSOLE ERROR: ${text}`);
  });
  return errors;
}

export async function dismissCover(page) {
  await page.waitForFunction(() => {
    return document.getElementById('coverScreen') || document.getElementById('lobbyScreen');
  }, { timeout: 60000 });

  // If a cover screen exists, wait briefly for its controller and bypass it.
  const hasCover = await page.evaluate(() => !!document.getElementById('coverScreen'));
  if (hasCover) {
    await page.waitForFunction(() => !!window.coverController, { timeout: 10000 }).catch(() => {});
    const canBypass = await page.evaluate(() => {
      const cover = document.getElementById('coverScreen');
      return cover && window.coverController && (cover.classList.contains('active') || window.getComputedStyle(cover).display !== 'none');
    });
    if (canBypass) {
      await page.evaluate(() => window.coverController._enterLobby({ username: '测试玩家' }));
    }
  }
}

export async function waitForLobby(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await dismissCover(page);
  await page.waitForFunction(() => {
    const lobby = document.getElementById('lobbyScreen');
    return lobby && window.getComputedStyle(lobby).display !== 'none' && !!window.lobbyController;
  }, { timeout: 60000 });

  const overlay = await page.locator('vite-error-overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    const text = await overlay.textContent();
    throw new Error(`Vite error overlay is visible: ${text}`);
  }
}

export async function returnToLobby(page) {
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
  }, { timeout: 30000 });
}

export async function selectStoryChapter(page, chapter = 1, skin = 'classic') {
  await page.evaluate((chapter) => {
    if (window.lobbyController) {
      window.lobbyController.save.account.unlockChapter(chapter);
      window.lobbyController.save.persist();
    }
  }, chapter);

  await page.click('.lobby-mode-btn[data-mode="story"]');
  await page.waitForSelector('.lobby-chapter-card[data-chapter="' + chapter + '"]', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(300);
  await page.locator(`.lobby-chapter-card[data-chapter="${chapter}"]`).click();
  await page.waitForTimeout(200);

  if (skin !== 'classic') {
    await page.evaluate((skin) => {
      if (window.lobbyController) {
        window.lobbyController.save.heroes.getHero('zhaoyun').skin = skin;
        window.lobbyController._renderPreview();
      }
    }, skin);
  }

  await page.waitForSelector('#lobbyStoryStart', { state: 'visible', timeout: 10000 });
  await page.click('#lobbyStoryStart');
  await waitForGameScene(page);
}

export async function startStoryChapter(page, chapter = 1, skin = 'classic') {
  await waitForLobby(page);
  await selectStoryChapter(page, chapter, skin);
}

export async function startEndless(page) {
  await waitForLobby(page);
  await page.click('.lobby-mode-btn[data-mode="endless"]');
  await page.waitForSelector('#lobbyEndlessStart', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(300);
  await page.click('#lobbyEndlessStart');
  await waitForGameScene(page);
}

export async function waitForGameScene(page) {
  await page.waitForFunction(() => {
    const scene = window.gameApp && window.gameApp.game && window.gameApp.game.scene.getScene('GameScene');
    return scene && scene.controller && scene.controller.player;
  }, { timeout: 30000 });
}

export async function getGameState(page) {
  return page.evaluate(() => {
    const scene = window.gameApp && window.gameApp.game && window.gameApp.game.scene.getScene('GameScene');
    if (!scene || !scene.controller) return null;
    const g = scene.controller;
    return {
      hasGame: !!window.gameApp && !!window.gameApp.game,
      hasScene: !!scene,
      playerAlive: !!(g.player && !g.player.dead),
      playerLevel: g.player ? g.player.level : 1,
      enemyCount: g.enemies ? g.enemies.length : 0,
      score: g.score,
      phase: g.getPhaseName ? g.getPhaseName() : '',
      running: g.running,
      paused: g.paused,
      drops: g.dropManager ? g.dropManager.drops.length : 0
    };
  });
}

export async function isVisible(page, selector) {
  return page.locator(selector).first().isVisible().catch(() => false);
}

export async function isHidden(page, selector) {
  return page.locator(selector).first().isHidden().catch(() => true);
}
