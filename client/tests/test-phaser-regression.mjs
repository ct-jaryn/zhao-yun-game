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

async function startChapter(page, chapter = 1, skin = 'classic') {
  await page.evaluate(() => {
    if (window.lobbyController) window.lobbyController._returnToLobby();
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
  });
  await page.waitForTimeout(500);

  // 解锁目标章节
  await page.evaluate((chapter) => {
    if (window.lobbyController) {
      window.lobbyController.save.account.unlockChapter(chapter);
      window.lobbyController.save.persist();
    }
  }, chapter);

  await page.click('.lobby-mode-btn[data-mode="story"]');
  await page.waitForTimeout(300);
  await page.locator(`.lobby-chapter-card[data-chapter="${chapter}"]`).click();
  await page.waitForTimeout(200);

  await page.evaluate((skin) => {
    if (window.lobbyController) {
      window.lobbyController.save.heroes.getHero('zhaoyun').skin = skin;
      window.lobbyController._renderPreview();
    }
  }, skin);

  await page.click('#lobbyStoryStart');
  await page.waitForFunction(() => {
    const scene = window.gameApp && window.gameApp.game.scene.getScene('GameScene');
    return scene && scene.controller && scene.controller.player;
  }, { timeout: 30000 });
}

async function testPause(browser) {
  const { page, errors } = await setupPage(browser);
  await startChapter(page);
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.togglePause();
  });
  await page.waitForTimeout(500);
  const pauseVisible = await page.locator('#pauseOverlay').isVisible().catch(() => false);
  const paused = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.paused);
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.togglePause();
  });
  await page.waitForTimeout(500);
  const resumed = await page.evaluate(() => !window.gameApp.game.scene.getScene('GameScene').controller.paused);
  console.log('Pause panel visible:', pauseVisible);
  console.log('Game paused:', paused);
  console.log('Game resumed:', resumed);
  try { await safeScreenshot(page, { path: 'test-phaser-pause.png', timeout: 5000 }); } catch (e) {}
  await page.close();
  if (!pauseVisible || !paused || !resumed || errors.length) throw new Error('pause test failed: ' + errors.join('\n'));
}

async function testEquip(browser) {
  const { page, errors } = await setupPage(browser);
  await startChapter(page);
  await page.waitForFunction(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    return scene && scene.controller && scene.controller.player;
  }, { timeout: 30000 });
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.toggleEquipPanel();
  });
  await page.waitForTimeout(500);
  const equipVisible = await page.locator('#equipPanel').isVisible().catch(() => false);
  const equipSlots = await page.locator('.equip-slot, .pause-equip-slot').count().catch(() => 0);
  console.log('Equip panel visible:', equipVisible);
  console.log('Equip slot count:', equipSlots);
  await safeScreenshot(page, { path: 'test-phaser-equip.png' });
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.toggleEquipPanel();
  });
  await page.waitForTimeout(500);
  const equipClosed = await page.locator('#equipPanel').isHidden().catch(() => true);
  console.log('Equip panel closed:', equipClosed);
  await page.close();
  if (!equipVisible || equipSlots < 5 || !equipClosed || errors.length) throw new Error('equip test failed: ' + errors.join('\n'));
}

async function testLevelUp(browser) {
  const { page, errors } = await setupPage(browser);
  await startChapter(page);
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    scene.controller.player.addExp(500, scene.controller);
  });
  await page.waitForTimeout(500);
  const levelUpVisible = await page.locator('#levelUpPanel').isVisible().catch(() => false);
  const rewardCards = await page.locator('.reward-card').count().catch(() => 0);
  console.log('Level up panel visible:', levelUpVisible);
  console.log('Reward cards count:', rewardCards);
  await safeScreenshot(page, { path: 'test-phaser-levelup.png' });
  if (levelUpVisible && rewardCards > 0) {
    await page.locator('.reward-card').first().click();
    await page.waitForTimeout(500);
  }
  const overlayClosed = await page.locator('#levelUpPanel').isHidden().catch(() => true);
  const playerLevel = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.player.level);
  console.log('Overlay closed:', overlayClosed);
  console.log('Player level:', playerLevel);
  await page.close();
  if (!levelUpVisible || rewardCards === 0 || !overlayClosed || playerLevel < 2 || errors.length) throw new Error('levelup test failed: ' + errors.join('\n'));
}

async function testDialogue(browser) {
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
  const speaker = await page.locator('#dialogueSpeaker').textContent().catch(() => '');
  const text = await page.locator('#dialogueText').textContent().catch(() => '');
  console.log('Dialogue visible:', dialogueVisible);
  console.log('Speaker:', speaker);
  console.log('Text:', text);
  await safeScreenshot(page, { path: 'test-phaser-dialogue.png' });
  if (dialogueVisible) {
    await page.click('#dialogueContinue');
    await page.waitForTimeout(500);
  }
  const dialogueClosed = await page.locator('#dialogueBox').isHidden().catch(() => true);
  const gamePaused = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.paused);
  console.log('Dialogue closed:', dialogueClosed);
  console.log('Game paused after dialogue:', gamePaused);
  await page.close();
  if (!dialogueVisible || speaker !== '貂蝉' || !dialogueClosed || gamePaused || errors.length) throw new Error('dialogue test failed: ' + errors.join('\n'));
}

async function testHints(browser) {
  const { page, errors } = await setupPage(browser);
  await startChapter(page);
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.player.x = 1500;
    g.player.y = 1000;
    g.player.syncSprite();
    g.enemies.forEach((e, i) => { e.x = 200 + i * 300; e.y = 100; e.syncSprite(); });
    scene.cameras.main.stopFollow();
    scene.cameras.main.setScroll(900, 600);
    scene.cameras.main.setZoom(1);
    g.directionHints.update(g.enemies);
  });
  await page.waitForTimeout(500);
  await safeScreenshot(page, { path: 'test-phaser-hints.png' });
  const hintInfo = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    return {
      enemyCount: g.enemies.filter(e => !e.dead).length,
      cameraScroll: { x: scene.cameras.main.scrollX, y: scene.cameras.main.scrollY },
      graphicsVisible: g.directionHints.graphics.visible,
      graphicsAlpha: g.directionHints.graphics.alpha
    };
  });
  console.log('Hint info:', hintInfo);
  await page.close();
  if (hintInfo.enemyCount === 0 || errors.length) throw new Error('hints test failed: ' + errors.join('\n'));
}

async function testCombat(browser) {
  const { page, errors } = await setupPage(browser);
  await startChapter(page);
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
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
    const scene = window.gameApp.game.scene.getScene('GameScene');
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
  await page.close();
  if (!state || !state.playerAlive || errors.length) throw new Error('combat test failed: ' + errors.join('\n'));
}

async function testPhase(browser) {
  const { page, errors } = await setupPage(browser);
  await startChapter(page, 2);
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.phaseManager.spawnBoss();
  });
  await page.waitForTimeout(1000);
  const afterSpawn = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    return {
      phase: g.getPhaseName(),
      bossCount: g.enemies.filter(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type)).length
    };
  });
  console.log('After spawnBoss:', afterSpawn);
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
  const afterKill = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    return {
      phase: g.getPhaseName(),
      midBossDefeated: g.phaseManager.midBossDefeated,
      playerLevel: g.player.level,
      dropCount: g.dropManager.drops.length
    };
  });
  console.log('After boss kill:', afterKill);
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.phaseManager.spawnFinalBosses();
  });
  await page.waitForTimeout(1000);
  const afterFinal = await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    return {
      phase: g.getPhaseName(),
      finalBossCount: g.enemies.filter(e => !e.dead && ['boss', 'lubu', 'dianwei', 'xuzhu'].includes(e.type)).length
    };
  });
  console.log('After spawnFinalBosses:', afterFinal);
  await safeScreenshot(page, { path: 'test-phaser-phase.png' });
  await page.close();
  if (afterSpawn.phase !== '典韦' || afterSpawn.bossCount < 1 || !afterKill.midBossDefeated || afterFinal.phase !== '曹操·狂暴 & 典韦' || afterFinal.finalBossCount < 2 || errors.length) throw new Error('phase test failed: ' + errors.join('\n'));
}

async function testGameOver(browser) {
  const { page, errors } = await setupPage(browser);
  await startChapter(page);
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const scene = window.gameApp.game.scene.getScene('GameScene');
    const g = scene.controller;
    g.player.takeDamage(99999);
  });
  await page.waitForTimeout(1000);
  const gameOverVisible = await page.locator('#gameOverScreen').isVisible().catch(() => false);
  const running = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.running);
  const dead = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.player.dead);
  console.log('Game over screen visible:', gameOverVisible);
  console.log('Game running:', running);
  console.log('Player dead:', dead);
  await safeScreenshot(page, { path: 'test-phaser-gameover.png' });
  await page.close();
  if (!gameOverVisible || running || !dead || errors.length) throw new Error('gameover test failed: ' + errors.join('\n'));
}

async function testVictory(browser) {
  const { page, errors } = await setupPage(browser);
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
  const finalKills = await page.locator('#finalKills').textContent().catch(() => '0');
  const running = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.running);
  console.log('Victory screen visible:', victoryVisible);
  console.log('Final kills text:', finalKills);
  console.log('Game running:', running);
  await safeScreenshot(page, { path: 'test-phaser-victory.png' });
  await page.close();
  if (!victoryVisible || running || errors.length) throw new Error('victory test failed: ' + errors.join('\n'));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const tests = [
    testPause,
    testEquip,
    testLevelUp,
    testDialogue,
    testHints,
    testCombat,
    testPhase,
    testGameOver,
    testVictory
  ];
  let failed = false;
  for (const t of tests) {
    try {
      console.log(`\n=== ${t.name} ===`);
      await t(browser);
    } catch (e) {
      console.error(`${t.name} failed:`, e.message);
      failed = true;
    }
  }
  await browser.close();
  if (failed) process.exit(1);
  console.log('\nAll regression tests passed!');
})();
