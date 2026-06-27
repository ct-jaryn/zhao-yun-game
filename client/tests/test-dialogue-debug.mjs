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
page.on('response', res => {
  if (res.status() === 404) {
    console.log('404:', res.url());
  }
});

await startStoryChapter(page, 1);
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

await safeScreenshot(page, { path: 'test-phaser-dialogue-debug.png' });

await page.close();
await browser.close();

if (!dialogueVisible || errors.length > 0) {
  process.exit(1);
}
