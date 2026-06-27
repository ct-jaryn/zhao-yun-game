export class ModeFooter {
  constructor(containerId, saveManager, onStartRun) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
    this.onStartRun = onStartRun;
    this.selectedChapter = 1;
    this.selectedDifficulty = 'normal';
    this.storyDialog = null;
    this.endlessDialog = null;
  }

  render() {
    if (!this.container) return;
    this.container.querySelectorAll('.lobby-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this._onModeClick(btn.dataset.mode));
    });
  }

  _onModeClick(mode) {
    if (mode === 'story') {
      this._openStoryDialog();
    } else if (mode === 'endless') {
      this._openEndlessDialog();
    } else if (mode === 'daily') {
      alert('每日挑战即将开放');
    } else if (mode === 'shop') {
      alert('商店即将开放');
    }
  }

  _openStoryDialog() {
    this._closeStoryDialog();
    const unlocked = this.save.account.unlockedChapters || [1];
    this.selectedChapter = unlocked[0] || 1;
    this.selectedDifficulty = 'normal';

    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.id = 'lobbyStoryDialog';
    dialog.innerHTML = `
      <div class="lobby-dialog-card">
        <h3>选择章节与难度</h3>
        <div class="lobby-chapter-grid" id="lobbyChapterGrid"></div>
        <div class="lobby-difficulty-row">
          <button class="difficulty-btn active" data-difficulty="normal">普通</button>
          <button class="difficulty-btn" data-difficulty="hard">困难</button>
          <button class="difficulty-btn" data-difficulty="hell">修罗</button>
        </div>
        <div class="lobby-dialog-actions">
          <button class="btn" id="lobbyStoryCancel">取消</button>
          <button class="btn btn-primary" id="lobbyStoryStart">开始战斗</button>
        </div>
      </div>
    `;

    document.getElementById('lobbyScreen').appendChild(dialog);
    this.storyDialog = dialog;

    dialog.querySelector('#lobbyStoryCancel').addEventListener('click', () => this._closeStoryDialog());
    dialog.querySelector('#lobbyStoryStart').addEventListener('click', () => {
      this._closeStoryDialog();
      if (this.onStartRun) this.onStartRun('story', { chapter: this.selectedChapter, difficulty: this.selectedDifficulty });
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) this._closeStoryDialog();
    });

    this._renderChapterGrid(dialog);
    this._bindDifficultyButtons(dialog, (d) => { this.selectedDifficulty = d; });
  }

  _closeStoryDialog() {
    const existing = document.getElementById('lobbyStoryDialog');
    if (existing) existing.remove();
    if (this.storyDialog) {
      this.storyDialog.remove();
      this.storyDialog = null;
    }
  }

  _openEndlessDialog() {
    this._closeEndlessDialog();
    this.selectedDifficulty = 'normal';

    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.id = 'lobbyEndlessDialog';
    dialog.innerHTML = `
      <div class="lobby-dialog-card">
        <h3>无尽模式</h3>
        <p>敌人无限刷新，存活越久奖励越多。</p>
        <div class="lobby-difficulty-row">
          <button class="difficulty-btn active" data-difficulty="normal">普通</button>
          <button class="difficulty-btn" data-difficulty="hard">困难</button>
          <button class="difficulty-btn" data-difficulty="hell">修罗</button>
        </div>
        <div class="lobby-dialog-actions">
          <button class="btn" id="lobbyEndlessCancel">取消</button>
          <button class="btn btn-primary" id="lobbyEndlessStart">开始挑战</button>
        </div>
      </div>
    `;

    document.getElementById('lobbyScreen').appendChild(dialog);
    this.endlessDialog = dialog;

    dialog.querySelector('#lobbyEndlessCancel').addEventListener('click', () => this._closeEndlessDialog());
    dialog.querySelector('#lobbyEndlessStart').addEventListener('click', () => {
      this._closeEndlessDialog();
      if (this.onStartRun) this.onStartRun('endless', { difficulty: this.selectedDifficulty });
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) this._closeEndlessDialog();
    });

    this._bindDifficultyButtons(dialog, (d) => { this.selectedDifficulty = d; });
  }

  _closeEndlessDialog() {
    const existing = document.getElementById('lobbyEndlessDialog');
    if (existing) existing.remove();
    if (this.endlessDialog) {
      this.endlessDialog.remove();
      this.endlessDialog = null;
    }
  }

  closeAllDialogs() {
    this._closeStoryDialog();
    this._closeEndlessDialog();
  }

  _renderChapterGrid(dialog) {
    const grid = dialog.querySelector('#lobbyChapterGrid');
    if (!grid) return;

    const chapters = [
      { id: 1, name: '第一章 · 虎牢救美', desc: '单骑闯虎牢，击败吕布，救回貂蝉。' },
      { id: 2, name: '第二章 · 血战宛城', desc: '曹军夜袭宛城，赵云单骑断后。' },
      { id: 3, name: '第三章 · 渭水怒涛', desc: '渭水河畔，龙胆枪撼虎痴许褚。' },
      { id: 4, name: '第四章 · 下邳焚天', desc: '下邳城下，决战无双飞将吕布。' }
    ];

    grid.innerHTML = chapters.map(ch => {
      const unlocked = this.save.account.isChapterUnlocked(ch.id);
      const active = this.selectedChapter === ch.id ? 'active' : '';
      const lockedClass = unlocked ? '' : 'locked';
      return `
        <div class="lobby-chapter-card ${active} ${lockedClass}" data-chapter="${ch.id}">
          <h4>${ch.name}</h4>
          <p>${unlocked ? ch.desc : '通关前置章节解锁'}</p>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.lobby-chapter-card').forEach(card => {
      card.addEventListener('click', () => {
        const chapter = parseInt(card.dataset.chapter, 10);
        if (!this.save.account.isChapterUnlocked(chapter)) return;
        this.selectedChapter = chapter;
        this._renderChapterGrid(dialog);
      });
    });
  }

  _bindDifficultyButtons(dialog, callback) {
    dialog.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        dialog.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        callback(btn.dataset.difficulty);
      });
    });
  }
}
