import { GameApp } from './phaser/GameApp.js';
import { LobbyController } from './lobby/LobbyController.js';
import { UIBridge } from './phaser/UIBridge.js';
import { CoverController } from './cover/CoverController.js';

window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  window.gameApp = app;

  let assetsReady = false;
  let pendingUserInfo = null;

  function initLobby(userInfo) {
    if (window.lobbyController) return;
    try {
      window.uiBridge = new UIBridge(app);
      window.lobbyController = new LobbyController(app);
      if (userInfo && window.lobbyController.setUserInfo) {
        window.lobbyController.setUserInfo(userInfo);
      }
      console.log('[main] Lobby initialized');
    } catch (err) {
      console.error('[main] 初始化大厅失败:', err);
    }
  }

  window.addEventListener('phaserAssetsReady', () => {
    assetsReady = true;
    if (pendingUserInfo) initLobby(pendingUserInfo);
  }, { once: true });

  window.coverController = new CoverController({
    onEnterLobby: (userInfo) => {
      pendingUserInfo = userInfo;
      const lobby = document.getElementById('lobbyScreen');
      if (lobby) lobby.classList.add('active');
      if (assetsReady) initLobby(userInfo);
    },
    onLogout: () => {
      // 封面页会重新显示，大厅由 CoverController 隐藏
      pendingUserInfo = null;
    }
  });
});
