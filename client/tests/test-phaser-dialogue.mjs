import { chromium } from 'playwright';
import { startStoryChapter } from './game-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

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

await startStoryChapter(page, 1);
  await page.waitForTimeout(1000);

  // 将玩家传送到貂蝉旁边
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
  const speaker = await page.locator('#dialogueSpeaker').textContent().catch(() => '');
  const text = await page.locator('#dialogueText').textContent().catch(() => '');

  console.log('Dialogue visible:', dialogueVisible);
  console.log('Speaker:', speaker);
  console.log('Text:', text);

  await safeScreenshot(page, { path: 'test-phaser-dialogue.png' });

  // 点击继续
  if (dialogueVisible) {
    await page.click('#dialogueContinue');
    await page.waitForTimeout(500);
  }

  const dialogueClosed = await page.locator('#dialogueBox').isHidden().catch(() => true);
  const gamePaused = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return scene.controller.paused;
  });

  console.log('Dialogue closed:', dialogueClosed);
  console.log('Game paused after dialogue:', gamePaused);
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!dialogueVisible || speaker !== '貂蝉' || !dialogueClosed || gamePaused || errors.length > 0) {
    process.exit(1);
  }
})();
