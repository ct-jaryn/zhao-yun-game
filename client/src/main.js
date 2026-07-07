import { GameApp } from './phaser/GameApp.js';
import { LobbyController } from './lobby/LobbyController.js';
import { UIBridge } from './phaser/UIBridge.js';
import { CoverController } from './cover/CoverController.js';

window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  // 保留全局引用仅用于调试与测试钩子，核心逻辑不再依赖 window.*
  window.gameApp = app;

  // 大厅导航器：UIBridge 通过此对象与 LobbyController 交互，避免直接访问 window
  const lobbyNavigator = { controller: null };
  window.uiBridge = new UIBridge(app, lobbyNavigator);

  let assetsReady = false;
  let pendingUserInfo = null;

  function initLobby(userInfo) {
    if (lobbyNavigator.controller) return;
    try {
      const lobby = new LobbyController(app);
      lobbyNavigator.controller = lobby;
      // 保留全局引用仅用于调试与测试钩子
      window.lobbyController = lobby;
      if (userInfo && lobby.setUserInfo) {
        lobby.setUserInfo(userInfo);
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
