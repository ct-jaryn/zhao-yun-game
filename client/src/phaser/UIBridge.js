export class UIBridge {
  constructor(gameApp) {
    this.gameApp = gameApp;
    this.bindEvents();
  }

  getGameScene() {
    return this.gameApp.game.scene.getScene('GameScene');
  }

  bindEvents() {
    // 旧开始菜单/章节选择/皮肤选择已被大厅取代，相关 DOM 当前处于隐藏状态。
    // 仅保留战斗内必要的暂停/恢复/重新开始/返回大厅绑定。
    const restartBtns = [document.getElementById('restartBtn'), document.getElementById('restartBtn2')];
    const backToChapterBtn = document.getElementById('backToChapterBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');

    if (backToChapterBtn) backToChapterBtn.addEventListener('click', () => this.returnToLobby());

    restartBtns.forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.returnToLobby());
    });

    if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
    if (resumeBtn) resumeBtn.addEventListener('click', () => this.togglePause());
  }

  startGame() {
    // 旧开始菜单已被大厅取代，若仍被调用则委托给大厅控制器
    if (window.lobbyController) {
      window.lobbyController.startRun('story', { chapter: 1, difficulty: 'normal' });
      return;
    }

    // 兜底：大厅未初始化时使用默认配置
    this.gameApp.startRun({
      heroId: 'zhaoyun',
      skin: 'classic',
      chapter: 1,
      difficulty: 'normal',
      mode: 'story'
    });
  }

  returnToLobby() {
    const scene = this.getGameScene();
    if (scene && scene.controller) {
      scene.controller.shutdown();
    }
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('equipPanel').style.display = 'none';
    document.getElementById('levelUpPanel').style.display = 'none';

    if (window.lobbyController) {
      window.lobbyController._returnToLobby();
    }
  }

  togglePause() {
    const scene = this.getGameScene();
    if (!scene || !scene.controller) return;
    scene.controller.togglePause();
  }
}
