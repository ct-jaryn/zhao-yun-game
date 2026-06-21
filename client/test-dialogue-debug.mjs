import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173/';

async function setupPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') errors.push(`CONSOLE ERROR: ${text}`);
  });
  page.on('response', res => {
    if (res.status() === 404) {
      console.log('404:', res.url());
    }
  });
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => {
    const btn = document.getElementById('startBtn');
    return btn && !btn.disabled;
  }, { timeout: 60000 });
  return { page, errors };
}

async function startChapter(page, chapter = 1, skin = 'classic') {
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
  await page.locator(`.chapter-card[data-chapter="${chapter}"]`).click();
  await page.waitForTimeout(300);
  await page.locator(`.skin-card[data-skin="${skin}"]`).click();
  await page.waitForTimeout(200);
  await page.click('#skinStartBtn');
  await page.waitForFunction(() => {
    const scene = window.gameApp && window.gameApp.game.scene.getScene('GameScene');
    return scene && scene.controller && scene.controller.player;
  }, { timeout: 30000 });
}

const browser = await chromium.launch({ headless: true });
const { page, errors } = await setupPage(browser);
await startChapter(page);
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const scene = window.gameApp.game.scene.getScene('GameScene');
  const g = scene.controller;
  const dc = g.phaseManager.diaochan;
  if (dc) {
    g.player.x = dc.x - 80;
    g.player.y = dc.y;
    g.player.syncSprite();
  }
});
await page.waitForTimeout(500);
const dialogueVisible = await page.locator('#dialogueBox').isVisible().catch(() => false);
console.log('Dialogue visible:', dialogueVisible);
console.log('Errors:', errors);
await page.screenshot({ path: 'test-phaser-dialogue-debug.png' });
await page.close();
await browser.close();
