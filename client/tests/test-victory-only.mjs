import { chromium } from 'playwright';
import { startStoryChapter } from './game-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

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

await page.waitForTimeout(1000);

const victoryVisible = await page.locator('#victoryScreen').isVisible().catch(() => false);
console.log('Victory visible:', victoryVisible);
const finalKills = await page.locator('#finalKills').textContent({ timeout: 5000 }).catch(() => '0');
console.log('Final kills text:', finalKills);
const running = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.running);
console.log('Game running:', running);

await safeScreenshot(page, { path: 'test-phaser-victory.png' });

await page.close();
await browser.close();

if (!victoryVisible || errors.length > 0) {
  process.exit(1);
}
