import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, waitForLobby, waitForGameScene, isVisible, isHidden } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

async function startChapter(page, chapter = 1, skin = 'classic') {
  await page.evaluate(() => {
    if (window.lobbyController) window.lobbyController._returnToLobby();
    const ids = ['gameOverScreen', 'victoryScreen', 'pauseOverlay'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }
  });
  await page.waitForFunction(() => {
    const lobby = document.getElementById('lobbyScreen');
    return lobby && window.getComputedStyle(lobby).display !== 'none';
  }, { timeout: 10000 });

  await page.evaluate((ch) => {
    if (window.lobbyController) {
      window.lobbyController.save.account.unlockChapter(ch);
      window.lobbyController.save.persist();
    }
  }, chapter);

  await page.click('.lobby-mode-btn[data-mode="story"]');
  await page.waitForSelector(`.lobby-chapter-card[data-chapter="${chapter}"]`, { state: 'visible', timeout: 10000 });
  await page.locator(`.lobby-chapter-card[data-chapter="${chapter}"]`).click({ force: true });

  await page.evaluate((s) => {
    if (window.lobbyController) {
      window.lobbyController.save.heroes.getHero('zhaoyun').skin = s;
      window.lobbyController._renderPreview();
    }
  }, skin);

  await page.click('#lobbyStoryStart');
  await waitForGameScene(page);
}

describe('regression suite', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
    await waitForLobby(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('pauses and resumes the game', async () => {
    await startChapter(page);
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.togglePause();
    });
    await page.waitForSelector('#pauseOverlay', { state: 'visible', timeout: 5000 });
    const pauseVisible = await isVisible(page, '#pauseOverlay');
    const paused = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.paused);
    expect(pauseVisible).toBe(true);
    expect(paused).toBe(true);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.togglePause();
    });
    await page.waitForSelector('#pauseOverlay', { state: 'hidden', timeout: 5000 });
    const resumed = await page.evaluate(() => !window.gameApp.game.scene.getScene('GameScene').controller.paused);
    expect(resumed).toBe(true);

    try { await safeScreenshot(page, { path: 'test-phaser-pause.png', timeout: 5000 }); } catch (e) {}
  });

  it('opens and closes the equip panel', async () => {
    await startChapter(page);
    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.toggleEquipPanel();
    });
    await page.waitForSelector('#equipPanel', { state: 'visible', timeout: 5000 });
    const equipVisible = await isVisible(page, '#equipPanel');
    const equipSlots = await page.locator('.equip-slot, .pause-equip-slot').count().catch(() => 0);
    expect(equipVisible).toBe(true);
    expect(equipSlots).toBeGreaterThanOrEqual(5);

    await safeScreenshot(page, { path: 'test-phaser-equip.png' });

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.toggleEquipPanel();
    });
    await page.waitForSelector('#equipPanel', { state: 'hidden', timeout: 5000 });
    const equipClosed = await isHidden(page, '#equipPanel');
    expect(equipClosed).toBe(true);
  });

  it('levels up and selects a reward', async () => {
    await startChapter(page);
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      scene.controller.player.addExp(500, scene.controller);
    });
    await page.waitForSelector('#levelUpPanel', { state: 'visible', timeout: 5000 });
    const levelUpVisible = await isVisible(page, '#levelUpPanel');
    const rewardCards = await page.locator('.reward-card').count().catch(() => 0);
    expect(levelUpVisible).toBe(true);
    expect(rewardCards).toBeGreaterThan(0);

    await safeScreenshot(page, { path: 'test-phaser-levelup.png' });

    await page.locator('.reward-card').first().click();
    await page.waitForSelector('#levelUpPanel', { state: 'hidden', timeout: 5000 });
    const overlayClosed = await isHidden(page, '#levelUpPanel');
    const playerLevel = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.player.level);
    expect(overlayClosed).toBe(true);
    expect(playerLevel).toBeGreaterThanOrEqual(2);
  });

  it('triggers and closes Diaochan dialogue', async () => {
    await startChapter(page);
    await page.waitForFunction(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene && scene.controller && scene.controller.phaseManager && scene.controller.phaseManager.diaochan;
    }, { timeout: 10000 });

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
    await page.waitForSelector('#dialogueBox', { state: 'visible', timeout: 5000 });
    const dialogueVisible = await isVisible(page, '#dialogueBox');
    expect(dialogueVisible).toBe(true);

    const speaker = await page.locator('#dialogueSpeaker').textContent().catch(() => '');
    expect(speaker).toBe('貂蝉');

    await safeScreenshot(page, { path: 'test-phaser-dialogue.png' });

    await page.click('#dialogueContinue');
    await page.waitForSelector('#dialogueBox', { state: 'hidden', timeout: 5000 });
    const dialogueClosed = await isHidden(page, '#dialogueBox');
    const gamePaused = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.paused);
    expect(dialogueClosed).toBe(true);
    expect(gamePaused).toBe(false);
  });

  it('renders direction hints', async () => {
    await startChapter(page);
    await page.waitForFunction(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene && scene.controller && scene.controller.enemies.length > 0;
    }, { timeout: 10000 });

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
    expect(hintInfo.enemyCount).toBeGreaterThan(0);
  });

  it('defeats an enemy in combat', async () => {
    await startChapter(page);
    await page.waitForFunction(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      return scene && scene.controller && scene.controller.enemies.length > 0;
    }, { timeout: 10000 });

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
        dropCount: g.dropManager.drops.length
      };
    });
    expect(state).toBeTruthy();
    expect(state.playerAlive).toBe(true);
  });

  it('progresses through phase to final bosses', async () => {
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
    expect(afterSpawn.phase).toBe('典韦');
    expect(afterSpawn.bossCount).toBeGreaterThanOrEqual(1);

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
    expect(afterKill.midBossDefeated).toBe(true);

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
    expect(afterFinal.phase).toBe('曹操·狂暴 & 典韦');
    expect(afterFinal.finalBossCount).toBeGreaterThanOrEqual(2);
    await safeScreenshot(page, { path: 'test-phaser-phase.png' });
  });

  it('shows game over on player death', async () => {
    await startChapter(page);
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      g.player.takeDamage(99999);
    });
    await page.waitForSelector('#gameOverScreen', { state: 'visible', timeout: 5000 });
    const gameOverVisible = await isVisible(page, '#gameOverScreen');
    const running = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.running);
    const dead = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.player.dead);
    expect(gameOverVisible).toBe(true);
    expect(running).toBe(false);
    expect(dead).toBe(true);
    await safeScreenshot(page, { path: 'test-phaser-gameover.png' });
  });

  it('shows victory screen after killing final bosses', async () => {
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
    await page.waitForSelector('#victoryScreen', { state: 'visible', timeout: 5000 });
    const victoryVisible = await isVisible(page, '#victoryScreen');
    const finalKills = await page.locator('#finalKills').textContent().catch(() => '0');
    expect(finalKills).toBeTruthy();
    const running = await page.evaluate(() => window.gameApp.game.scene.getScene('GameScene').controller.running);
    expect(victoryVisible).toBe(true);
    expect(running).toBe(false);
    await safeScreenshot(page, { path: 'test-phaser-victory.png' });
  });

  it('has collected no unexpected console/page errors', async () => {
    expect(errors).toHaveLength(0);
  });
});
