import { chromium } from 'playwright';

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
  await page.waitForFunction(() => {
    const btn = document.getElementById('startBtn');
    return btn && !btn.disabled;
  }, { timeout: 60000 });

  await page.click('#startBtn');
  await page.waitForTimeout(300);
  await page.locator('.chapter-card[data-chapter="2"]').click();
  await page.waitForTimeout(300);
  await page.locator('.skin-card[data-skin="classic"]').click();
  await page.waitForTimeout(200);
  await page.click('#skinStartBtn');

  await page.waitForFunction(() => {
    const scene = window.gameApp && window.gameApp.game.scene.getScene('GameScene');
    return scene && scene.controller && scene.controller.player;
  }, { timeout: 30000 });

  await page.waitForTimeout(2000);

  // 进入最终阶段
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.phaseManager.spawnFinalBosses();
  });

  await page.waitForTimeout(1000);

  // 击杀所有最终 Boss
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
  const finalKills = await page.locator('#finalKills').textContent().catch(() => '0');
  const running = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return scene.controller.running;
  });

  console.log('Victory screen visible:', victoryVisible);
  console.log('Final kills text:', finalKills);
  console.log('Game running:', running);

  await page.screenshot({ path: 'test-phaser-victory.png' });

  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (!victoryVisible || running || errors.length > 0) {
    process.exit(1);
  }
})();
