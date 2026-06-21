import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173/';

async function setupPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => {
    const btn = document.getElementById('startBtn');
    return btn && !btn.disabled;
  }, { timeout: 60000 });
  return { page, errors: [] };
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
const { page } = await setupPage(browser);
await startChapter(page, 2);
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
await page.waitForTimeout(1000);
const victoryVisible = await page.locator('#victoryScreen').isVisible().catch(() => false);
console.log('Victory visible:', victoryVisible);
const finalKills = await page.locator('#finalKills').textContent({ timeout: 5000 }).catch(() => '0');
console.log('Final kills text:', finalKills);
const running = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.running);
console.log('Game running:', running);
await page.screenshot({ path: 'test-phaser-victory.png' });
await page.close();
await browser.close();
