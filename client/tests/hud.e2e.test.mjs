import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupBrowser, teardown, collectErrors, startStoryChapter, isVisible, isHidden } from './e2e-helper.mjs';
import { safeScreenshot } from './screenshot-helper.mjs';

let browser;
let page;
let errors;

describe('hud', () => {
  beforeAll(async () => {
    browser = await setupBrowser();
    page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    errors = collectErrors(page);
  });

  afterAll(async () => {
    await teardown(browser);
  });

  it('reflects combo, dodge cooldown, wave progress, pickup hint and low hp warning', async () => {
    await startStoryChapter(page, 1);

    await page.evaluate(() => {
      const scene = window.gameApp.game.scene.getScene('GameScene');
      const g = scene.controller;
      const p = g.player;

      p.combo = 15;
      p.comboTimer = 60;
      p.dodgeCd = 1.5;
      g.phaseManager.soldierKills = 8;
      p.hp = 20;

      const drop = g.dropManager.spawnDrop(p.x + 75, p.y, p.level);
      g.dropManager.checkNearestDrop();
    });

    await page.waitForTimeout(500);

    const hudState = await page.evaluate(() => {
      return {
        comboVisible: window.getComputedStyle(document.getElementById('comboDisplay')).display !== 'none',
        comboNum: document.getElementById('comboNum').textContent,
        waveCountdownVisible: document.querySelector('#scorePanel .wave-countdown').classList.contains('active'),
        waveCountdownText: document.getElementById('waveCountdown').textContent,
        dodgeReady: document.getElementById('dodgeIcon').classList.contains('ready'),
        dodgeCdText: document.querySelector('#dodgeIcon .dodge-cd') ? document.querySelector('#dodgeIcon .dodge-cd').textContent : '',
        pickupHintVisible: window.getComputedStyle(document.getElementById('pickupHint')).display !== 'none',
        pickupHintName: document.getElementById('phName').textContent,
        lowHpWarning: document.getElementById('lowHpWarning').classList.contains('danger')
      };
    });

    expect(hudState.comboVisible).toBe(true);
    expect(hudState.comboNum).toBe('15');
    expect(hudState.waveCountdownVisible).toBe(true);
    expect(hudState.waveCountdownText).toBe('8/20');
    expect(hudState.dodgeReady).toBe(false);
    expect(hudState.dodgeCdText).not.toBe('');
    expect(hudState.pickupHintVisible).toBe(true);
    expect(hudState.pickupHintName).not.toBe('');
    expect(hudState.lowHpWarning).toBe(true);

    await safeScreenshot(page, { path: 'test-phaser-hud.png', timeout: 5000 });
    expect(errors).toHaveLength(0);
  });
});
