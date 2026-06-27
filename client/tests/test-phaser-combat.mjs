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
  // 等待生成敌人
  await page.waitForTimeout(2000);

  // 将玩家传送到第一个敌人旁边并自动攻击 5 秒
  await page.evaluate(async () => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    const p = g.player;
    const target = g.enemies.find(e => !e.dead);
    if (target) {
      p.x = target.x + 60;
      p.y = target.y;
      p.dir = Math.atan2(target.y - p.y, target.x - p.x);
      p.syncSprite();
    }
  });

  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      const p = g.player;
      const target = g.enemies.find(e => !e.dead);
      if (target) {
        p.dir = Math.atan2(target.y - p.y, target.x - p.x);
        p.useSkill(0, g);
      }
    });
    await page.waitForTimeout(250);
  }

  await page.waitForTimeout(1000);
  await safeScreenshot(page, { path: 'test-phaser-combat.png' });

  const state = await page.evaluate(() => {
    const scene = window.gameApp && window.gameApp.game.scene.getScene('GameScene');
    if (!scene || !scene.controller) return null;
    const g = scene.controller;
    return {
      playerAlive: !g.player.dead,
      level: g.player.level,
      kills: g.totalKills,
      score: g.score,
      phase: g.getPhaseName(),
      enemyCount: g.enemies.length,
      dropCount: g.dropManager.drops.length,
      drops: g.dropManager.drops.map(d => ({ x: d.x, y: d.y, type: d.type, name: d.name }))
    };
  });

  console.log('Combat state:', state);
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!state || !state.playerAlive || errors.length > 0) {
    process.exit(1);
  }
})();
