import { chromium } from 'playwright';

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

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  const overlay = await page.locator('vite-error-overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    const text = await overlay.textContent();
    console.error('Vite error overlay:', text);
    await page.screenshot({ path: 'test-phaser-error.png' });
    await browser.close();
    process.exit(1);
  }

  await page.waitForFunction(() => {
    const btn = document.getElementById('startBtn');
    return btn && !btn.disabled;
  }, { timeout: 60000 });

  let allPassed = true;

  for (const test of TESTS) {
    console.log(`\nTesting chapter=${test.chapter} skin=${test.skin}`);

    // 返回开始界面
    await page.evaluate(() => {
      document.getElementById('startScreen').style.display = 'flex';
      document.getElementById('chapterScreen').style.display = 'none';
      document.getElementById('skinScreen').style.display = 'none';
      document.getElementById('gameOverScreen').style.display = 'none';
      document.getElementById('victoryScreen').style.display = 'none';
      document.getElementById('pauseOverlay').style.display = 'none';
      document.getElementById('adLockOverlay').style.display = 'none';
    });

    await page.click('#startBtn');
    await page.waitForTimeout(300);

    if (test.chapter === 4) {
      await page.evaluate(() => localStorage.setItem('zhaoyun_chapter4_unlocked', 'true'));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        const btn = document.getElementById('startBtn');
        return btn && !btn.disabled;
      }, { timeout: 60000 });
      await page.click('#startBtn');
      await page.waitForTimeout(300);
    }

    await page.locator(`.chapter-card[data-chapter="${test.chapter}"]`).click();
    await page.waitForTimeout(300);

    await page.locator(`.skin-card[data-skin="${test.skin}"]`).click();
    await page.waitForTimeout(200);

    await page.click('#skinStartBtn');
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
    await page.screenshot({ path: `test-phaser-ch${test.chapter}-${test.skin}.png` });

    if (!state.hasGame || !state.hasScene || !state.playerAlive) {
      console.error(`FAILED chapter=${test.chapter} skin=${test.skin}`);
      allPassed = false;
      await page.screenshot({ path: `test-fail-${test.chapter}-${test.skin}.png` });
    }
  }

  await browser.close();

  if (!allPassed || errors.length > 0) {
    console.error('\nErrors:', errors.length ? errors.join('\n') : 'none');
    process.exit(1);
  }
  console.log('\nAll tests passed!');
})();
