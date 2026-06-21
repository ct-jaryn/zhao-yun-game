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

  // 直接触发曹操阶段
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.phaseManager.spawnBoss();
  });

  await page.waitForTimeout(1000);

  const state1 = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    return {
      phase: g.getPhaseName(),
      bossCount: g.enemies.filter(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type)).length
    };
  });

  console.log('After spawnBoss:', state1);

  // 将玩家传送到 Boss 旁边并击杀
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    const boss = g.enemies.find(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type));
    if (boss) {
      g.player.x = boss.x + 80;
      g.player.y = boss.y;
      g.player.dir = Math.atan2(boss.y - g.player.y, boss.x - g.player.x);
      boss.takeDamage(99999, false, 0, g);
    }
  });

  await page.waitForTimeout(1000);

  const state2 = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    return {
      phase: g.getPhaseName(),
      midBossDefeated: g.phaseManager.midBossDefeated,
      playerLevel: g.player.level,
      dropCount: g.dropManager.drops.length
    };
  });

  console.log('After boss kill:', state2);

  await page.screenshot({ path: 'test-phaser-phase.png' });

  // 触发最终阶段
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.phaseManager.spawnFinalBosses();
  });

  await page.waitForTimeout(1000);

  const state3 = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    return {
      phase: g.getPhaseName(),
      finalBossCount: g.enemies.filter(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type)).length
    };
  });

  console.log('After spawnFinalBosses:', state3);
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');

  await browser.close();

  if (state1.phase !== '典韦' || state1.bossCount < 1 || !state2.midBossDefeated || state3.phase !== '曹操·狂暴 & 典韦' || state3.finalBossCount < 2 || errors.length > 0) {
    process.exit(1);
  }
})();
