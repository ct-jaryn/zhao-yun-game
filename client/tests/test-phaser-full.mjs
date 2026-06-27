import { chromium } from 'playwright';
import { safeScreenshot } from './screenshot-helper.mjs';

const TESTS = [
  { chapter: 1, skin: 'classic' },
  { chapter: 1, skin: 'mecha' },
  { chapter: 2, skin: 'classic' },
  { chapter: 3, skin: 'classic' },
  { chapter: 4, skin: 'classic' }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];

  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('GPU stall') || text.includes('ReadPixels')) return;
    if (type === 'error' && (text.includes('401') || text.includes('ERR_CONNECTION_CLOSED') || text.includes('ERR_CONNECTION_REFUSED') || text.includes('ERR_NETWORK_IO_SUSPENDED') || text.includes('Failed to process file'))) return;
    if (type === 'error') errors.push(`CONSOLE ERROR: ${text}`);
  });

  await page.goto('http://localhost:5177/', { waitUntil: 'domcontentloaded' });

  const overlay = await page.locator('vite-error-overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    const text = await overlay.textContent();
    console.error('Vite error overlay:', text);
    await safeScreenshot(page, { path: 'test-phaser-error.png' });
    await browser.close();
    process.exit(1);
  }

  await page.waitForFunction(() => {
    const lobby = document.getElementById('lobbyScreen');
    return lobby && window.getComputedStyle(lobby).display !== 'none' && !!window.lobbyController;
  }, { timeout: 60000 });

  let allPassed = true;

  for (const test of TESTS) {
    console.log(`\nTesting chapter=${test.chapter} skin=${test.skin}`);

    // 返回大厅
    await page.evaluate(() => {
      if (window.lobbyController) window.lobbyController._returnToLobby();
      document.getElementById('gameOverScreen').style.display = 'none';
      document.getElementById('victoryScreen').style.display = 'none';
      document.getElementById('pauseOverlay').style.display = 'none';
    });
    await page.waitForTimeout(500);

    // 如果测试第四章，先解锁
    if (test.chapter === 4) {
      await page.evaluate(() => {
        localStorage.setItem('zhaoyun_chapter4_unlocked', 'true');
        location.reload();
      });
      await page.waitForFunction(() => {
        const lobby = document.getElementById('lobbyScreen');
        return lobby && window.getComputedStyle(lobby).display !== 'none' && !!window.lobbyController;
      }, { timeout: 60000 });
    }

    // 解锁目标章节
    await page.evaluate((chapter) => {
      if (window.lobbyController) {
        window.lobbyController.save.account.unlockChapter(chapter);
        window.lobbyController.save.persist();
      }
    }, test.chapter);

    // 打开剧情模式对话框
    await page.click('.lobby-mode-btn[data-mode="story"]');
    await page.waitForTimeout(300);

    // 选择章节
    await page.locator(`.lobby-chapter-card[data-chapter="${test.chapter}"]`).click();
    await page.waitForTimeout(200);

    // 选择皮肤：通过页面状态切换
    await page.evaluate((skin) => {
      if (window.lobbyController) {
        window.lobbyController.save.heroes.getHero('zhaoyun').skin = skin;
        window.lobbyController._renderPreview();
      }
    }, test.skin);

    // 开始战斗
    await page.click('#lobbyStoryStart');
    await page.waitForTimeout(3000);

    // 模拟移动和技能
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

    console.log('State:', state);
    try {
      await safeScreenshot(page, { path: `test-phaser-ch${test.chapter}-${test.skin}.png`, timeout: 5000 });
    } catch (e) {
      console.log(`Screenshot skipped for chapter=${test.chapter} skin=${test.skin}: ${e.message}`);
    }

    if (!state.hasGame || !state.hasScene || !state.playerAlive) {
      console.error(`FAILED chapter=${test.chapter} skin=${test.skin}`);
      allPassed = false;
      try {
        await safeScreenshot(page, { path: `test-fail-${test.chapter}-${test.skin}.png`, timeout: 5000 });
      } catch (e) {}
    }
  }

  await browser.close();

  if (!allPassed || errors.length > 0) {
    console.error('\nErrors:', errors.length ? errors.join('\n') : 'none');
    process.exit(1);
  }
  console.log('\nAll tests passed!');
})();
