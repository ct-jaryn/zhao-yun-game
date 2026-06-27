const CHAPTER4_UNLOCK_KEY = 'zhaoyun_chapter4_unlocked';

export class UIBridge {
  constructor(gameApp) {
    this.gameApp = gameApp;
    this.selectedChapter = 1;
    this.selectedSkin = 'classic';
    this.adTimerId = null;
    this.pendingAdChapter = 1;
    this.bindEvents();
  }

  isChapter4Unlocked() {
    try {
      return localStorage.getItem(CHAPTER4_UNLOCK_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  unlockChapter4() {
    try {
      localStorage.setItem(CHAPTER4_UNLOCK_KEY, 'true');
    } catch (e) {}
  }

  closeAdLock() {
    const overlay = document.getElementById('adLockOverlay');
    if (overlay) overlay.style.display = 'none';
    if (this.adTimerId) {
      clearInterval(this.adTimerId);
      this.adTimerId = null;
    }
    const btn = document.getElementById('adUnlockBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '观看广告 5 秒';
    }
  }

  showAdLock(chapter) {
    this.pendingAdChapter = chapter;
    const overlay = document.getElementById('adLockOverlay');
    const timerEl = document.getElementById('adTimer');
    const btn = document.getElementById('adUnlockBtn');
    const frame = document.getElementById('adFrame');
    if (!overlay || !timerEl || !btn) return;

    overlay.style.display = 'flex';
    btn.disabled = true;
    btn.textContent = '观看广告 5 秒';
    if (frame) frame.src = 'https://monkeycode-ai.com/';

    let remaining = 5;
    timerEl.textContent = remaining;

    if (this.adTimerId) clearInterval(this.adTimerId);
    this.adTimerId = setInterval(() => {
      remaining--;
      timerEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this.adTimerId);
        this.adTimerId = null;
        btn.disabled = false;
        btn.textContent = '解锁第四章';
      }
    }, 1000);

    btn.onclick = () => {
      this.unlockChapter4();
      this.closeAdLock();
      this.selectedChapter = chapter;
      this.showSkinSelect();
      this.updateChapterLockState();
    };
  }

  updateChapterLockState() {
    document.querySelectorAll('.chapter-card').forEach(card => {
      const chapter = parseInt(card.dataset.chapter, 10);
      const isLocked = chapter === 4 && !this.isChapter4Unlocked();
      card.classList.toggle('locked', isLocked);
      let lockEl = card.querySelector('.chapter-lock');
      if (isLocked) {
        if (!lockEl) {
          lockEl = document.createElement('div');
          lockEl.className = 'chapter-lock';
          lockEl.innerHTML = '<img class="chapter-lock-icon" src="/generated/icon_lock.png" alt="锁定">';
          card.appendChild(lockEl);
        }
      } else if (lockEl) {
        lockEl.remove();
      }
    });
  }

  getGameScene() {
    return this.gameApp.game.scene.getScene('GameScene');
  }

  bindEvents() {
    const startBtn = document.getElementById('startBtn');
    const chapterBackBtn = document.getElementById('chapterBackBtn');
    const skinBackBtn = document.getElementById('skinBackBtn');
    const skinStartBtn = document.getElementById('skinStartBtn');
    const restartBtns = [document.getElementById('restartBtn'), document.getElementById('restartBtn2')];
    const backToChapterBtn = document.getElementById('backToChapterBtn');

    if (startBtn) startBtn.addEventListener('click', () => this.showChapterSelect());
    if (chapterBackBtn) chapterBackBtn.addEventListener('click', () => this.showStartScreen());
    if (skinBackBtn) skinBackBtn.addEventListener('click', () => this.showChapterSelect());
    if (skinStartBtn) skinStartBtn.addEventListener('click', () => this.startGame());
    if (backToChapterBtn) backToChapterBtn.addEventListener('click', () => this.returnToLobby());

    restartBtns.forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.returnToLobby());
    });

    document.querySelectorAll('.chapter-card').forEach(card => {
      card.addEventListener('click', () => {
        const chapter = parseInt(card.dataset.chapter, 10);
        if (chapter === 4 && !this.isChapter4Unlocked()) {
          this.showAdLock(chapter);
          return;
        }
        this.selectedChapter = chapter;
        this.showSkinSelect();
      });
    });

    const adBackBtn = document.getElementById('adBackBtn');
    if (adBackBtn) adBackBtn.addEventListener('click', () => this.closeAdLock());

    document.querySelectorAll('.skin-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedSkin = card.dataset.skin;
      });
    });

    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
    if (resumeBtn) resumeBtn.addEventListener('click', () => this.togglePause());

    this.initStartTabs();
  }

  initStartTabs() {
    const tabs = document.querySelectorAll('.start-tab');
    const bodies = document.querySelectorAll('.start-panel-body');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        bodies.forEach(b => b.classList.remove('active'));
        tab.classList.add('active');
        const body = document.getElementById(`tab-${target}`);
        if (body) body.classList.add('active');
      });
    });
  }

  showStartScreen() {
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('chapterScreen').style.display = 'none';
    document.getElementById('skinScreen').style.display = 'none';
  }

  showChapterSelect() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('chapterScreen').style.display = 'flex';
    document.getElementById('skinScreen').style.display = 'none';
    this.updateChapterLockState();
  }

  showSkinSelect() {
    document.getElementById('chapterScreen').style.display = 'none';
    document.getElementById('skinScreen').style.display = 'flex';
  }

  startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('chapterScreen').style.display = 'none';
    document.getElementById('skinScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('equipPanel').style.display = 'none';
    document.getElementById('levelUpPanel').style.display = 'none';
    document.getElementById('adLockOverlay').style.display = 'none';

    this.updateSkinAvatars();
    this.gameApp.startChapter(this.selectedChapter, this.selectedSkin);
  }

  updateSkinAvatars() {
    const hudAvatar = document.getElementById('hudAvatar');
    const pauseAvatar = document.getElementById('pauseAvatar');
    const avatarSrc = this.selectedSkin === 'mecha' ? '/player_mecha/avatar.png' : '/generated/avatar.png';
    if (hudAvatar) hudAvatar.src = avatarSrc;
    if (pauseAvatar) pauseAvatar.src = avatarSrc;
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
    } else {
      this.showStartScreen();
    }
  }

  togglePause() {
    const scene = this.getGameScene();
    if (!scene || !scene.controller) return;
    scene.controller.togglePause();
  }

}
