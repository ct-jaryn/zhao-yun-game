export const BASE_URL = 'http://localhost:5177/';

export async function waitForLobby(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const lobby = document.getElementById('lobbyScreen');
    return lobby && window.getComputedStyle(lobby).display !== 'none' && !!window.lobbyController;
  }, { timeout: 60000 });
}

export async function startStoryChapter(page, chapter = 1) {
  await waitForLobby(page);

  const overlay = await page.locator('vite-error-overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    const text = await overlay.textContent();
    console.error('Vite error overlay:', text);
    throw new Error('Vite error overlay is visible');
  }

  // 测试需要时自动解锁目标章节
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

  await page.click('#lobbyStoryStart');
  await page.waitForFunction(() => {
    const scene = window.gameApp && window.gameApp.game.scene.getScene('GameScene');
    return scene && scene.controller && scene.controller.player;
  }, { timeout: 30000 });
}
