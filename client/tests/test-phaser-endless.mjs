import { chromium } from 'playwright';
import { safeScreenshot } from './screenshot-helper.mjs';

const BASE_URL = 'http://localhost:5177/';

async function setupPage(browser) {
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
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => {
        const lobby = document.getElementById('lobbyScreen');
        return lobby && window.getComputedStyle(lobby).display !== 'none' && !!window.lobbyController;
      }, { timeout: 60000 });
      return { page, errors };
    } catch (e) {
      lastErr = e;
      console.log(`  setupPage attempt ${attempt + 1} failed: ${e.message}`);
    }
  }
  await page.close();
  throw lastErr;
}

async function startEndless(page, difficulty = 'normal') {
  await page.evaluate(() => {
    if (window.lobbyController) window.lobbyController._returnToLobby();
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
  });
  await page.waitForTimeout(500);

  await page.click('.lobby-mode-btn[data-mode="endless"]');
  await page.waitForTimeout(300);

  if (difficulty !== 'normal') {
    await page.locator(`#lobbyEndlessDialog .difficulty-btn[data-difficulty="${difficulty}"]`).click();
    await page.waitForTimeout(200);
  }

  await page.click('#lobbyEndlessStart');
  await page.waitForFunction(() => {
    const scene = window.gameApp && window.gameApp.game.scene.getScene('GameScene');
    return scene && scene.controller && scene.controller.player;
  }, { timeout: 30000 });
}

async function testEndlessMode(browser) {
  const { page, errors } = await setupPage(browser);
  await startEndless(page);
  await page.waitForTimeout(2000);

  const initialState = await page.evaluate(() => {
    const c = window.gameApp.game.scene.getScene('GameScene').controller;
    return {
      mode: c.runConfig.mode,
      enemyCount: c.enemies.filter(e => !e.dead).length,
      gameTime: c.gameTime,
      wave: c.phaseManager.wave
    };
  });
  console.log('Initial endless state:', initialState);

  if (initialState.mode !== 'endless') throw new Error('not in endless mode');
  if (initialState.enemyCount < 1) throw new Error('no enemies spawned');
  if (initialState.wave !== 1) throw new Error('wave did not start at 1');

  // Let the game run a bit longer to confirm continuous spawning
  await page.waitForTimeout(3000);

  const midState = await page.evaluate(() => {
    const c = window.gameApp.game.scene.getScene('GameScene').controller;
    return {
      running: c.running,
      enemyCount: c.enemies.filter(e => !e.dead).length,
      gameTime: c.gameTime,
      wave: c.phaseManager.wave
    };
  });
  console.log('Mid endless state:', midState);

  if (!midState.running) throw new Error('game stopped unexpectedly');
  if (midState.enemyCount < 1) throw new Error('enemies did not keep spawning');
  if (midState.gameTime <= initialState.gameTime) throw new Error('game time did not advance');

  // Force player death to end the run
  await page.evaluate(() => {
    const c = window.gameApp.game.scene.getScene('GameScene').controller;
    if (c.player && c.running) {
      c.player.takeDamage(999999, false, 0, c);
    }
  });
  await page.waitForTimeout(1500);

  const gameOverVisible = await page.locator('#gameOverScreen').isVisible().catch(() => false);
  const finalWave = await page.locator('#finalWave').textContent().catch(() => '');
  const bestWaveBefore = await page.evaluate(() => {
    const lc = window.lobbyController;
    return lc ? lc.save.progression._data.endless.bestWave : 0;
  });

  console.log('Game over visible:', gameOverVisible);
  console.log('Final wave text:', finalWave);
  console.log('Recorded best wave before return:', bestWaveBefore);

  await safeScreenshot(page, { path: 'test-phaser-endless.png' });

  // Return to lobby and check recorded stats
  await page.click('#restartBtn');
  await page.waitForFunction(() => {
    const lobby = document.getElementById('lobbyScreen');
    return lobby && window.getComputedStyle(lobby).display !== 'none';
  }, { timeout: 10000 });
  await page.waitForTimeout(500);

  const bestWaveAfter = await page.evaluate(() => {
    const lc = window.lobbyController;
    return lc ? lc.save.progression._data.endless.bestWave : 0;
  });
  console.log('Recorded best wave after return:', bestWaveAfter);

  await page.close();

  if (!gameOverVisible) throw new Error('game over screen not shown');
  if (!finalWave.includes('波')) throw new Error('final wave not shown: ' + finalWave);
  if (bestWaveAfter < 1) throw new Error('endless wave not recorded: ' + bestWaveAfter);
  if (errors.length) throw new Error('endless test failed: ' + errors.join('\n'));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    console.log('\n=== testEndlessMode ===');
    await testEndlessMode(browser);
    console.log('\nEndless mode test passed!');
  } catch (e) {
    console.error('Endless mode test failed:', e.message);
    await browser.close();
    process.exit(1);
  }
  await browser.close();
})();
