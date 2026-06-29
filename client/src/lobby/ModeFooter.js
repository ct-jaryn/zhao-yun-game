import { DailyChallenge } from '../save/DailyChallenge.js';
import { Shop } from '../save/Shop.js';
import { CURRENCY_ICONS, SHOP_ITEMS } from '../config/index.js';
import { Toast } from './Toast.js';

export class ModeFooter {
  constructor(containerId, saveManager, onStartRun, onRefresh) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
    this.onStartRun = onStartRun;
    this.onRefresh = onRefresh;
    this.selectedChapter = 1;
    this.selectedDifficulty = 'normal';
    this.storyDialog = null;
    this.endlessDialog = null;
    this.dailyDialog = null;
    this.shopDialog = null;
    this.dailyChallenge = new DailyChallenge(saveManager);
    this.shop = new Shop(saveManager);
    this._boundOnContainerClick = (e) => {
      const btn = e.target.closest('.lobby-mode-btn');
      if (!btn) return;
      this._onModeClick(btn.dataset.mode);
    };
    if (this.container) {
      this.container.addEventListener('click', this._boundOnContainerClick);
    }
  }

  render() {
    if (!this.container) return;
    this.container.querySelectorAll('.lobby-mode-btn').forEach(btn => {
      const mode = btn.dataset.mode;
      const implemented = mode === 'story' || mode === 'endless' || mode === 'daily' || mode === 'shop';
      btn.classList.toggle('disabled', !implemented);
      btn.title = implemented ? '' : '即将开放';
    });
  }

  _onModeClick(mode) {
    if (mode === 'story') {
      this._openStoryDialog();
    } else if (mode === 'endless') {
      this._openEndlessDialog();
    } else if (mode === 'daily') {
      this._openDailyDialog();
    } else if (mode === 'shop') {
      this._openShopDialog();
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

  _openDailyDialog() {
    this._closeDailyDialog();
    const canComplete = this.dailyChallenge.canComplete();
    const challenge = this.dailyChallenge.getTodayChallenge();
    const heroCfg = this.save.heroes.getHero(challenge.heroId);
    const skin = heroCfg.skin || 'classic';
    const heroData = this.save.heroes.getHero(challenge.heroId);
    const progress = this.save.account._data.daily.challengeCompletions || 0;

    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.id = 'lobbyDailyDialog';
    dialog.innerHTML = `
      <div class="lobby-dialog-card daily-card">
        <h3>每日挑战</h3>
        <div class="daily-info">
          <div class="daily-row"><span class="daily-label">今日挑战</span><span class="daily-value">${challenge.dateStr}</span></div>
          <div class="daily-row"><span class="daily-label">英雄</span><span class="daily-value">${this._heroName(challenge.heroId)}</span></div>
          <div class="daily-row"><span class="daily-label">章节</span><span class="daily-value">第 ${challenge.chapter} 章</span></div>
          <div class="daily-row"><span class="daily-label">难度</span><span class="daily-value">${this._difficultyName(challenge.difficulty)}</span></div>
          <div class="daily-row"><span class="daily-label">词缀</span><span class="daily-value modifier">${challenge.modifier.name} · ${challenge.modifier.desc}</span></div>
          <div class="daily-row"><span class="daily-label">今日进度</span><span class="daily-value">${progress} / 3 次</span></div>
        </div>
        <div class="daily-rewards">
          <span>首通奖励：铜币 ${this.dailyChallenge.getRewards(challenge.difficulty, true).coins} · 将魂 ${this.dailyChallenge.getRewards(challenge.difficulty, true).souls} · 元宝 ${this.dailyChallenge.getRewards(challenge.difficulty, true).gems}</span>
        </div>
        <div class="lobby-dialog-actions">
          <button class="btn" id="lobbyDailyCancel">取消</button>
          <button class="btn btn-primary" id="lobbyDailyStart" ${canComplete ? '' : 'disabled'}>${canComplete ? '开始挑战' : '今日次数已用完'}</button>
        </div>
      </div>
    `;

    document.getElementById('lobbyScreen').appendChild(dialog);
    this.dailyDialog = dialog;

    dialog.querySelector('#lobbyDailyCancel').addEventListener('click', () => this._closeDailyDialog());
    dialog.querySelector('#lobbyDailyStart').addEventListener('click', () => {
      this._closeDailyDialog();
      if (this.onStartRun) {
        this.onStartRun('daily', {
          heroId: challenge.heroId,
          skin,
          chapter: challenge.chapter,
          difficulty: challenge.difficulty,
          modifier: challenge.modifier
        });
      }
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) this._closeDailyDialog();
    });
  }

  _closeDailyDialog() {
    const existing = document.getElementById('lobbyDailyDialog');
    if (existing) existing.remove();
    if (this.dailyDialog) {
      this.dailyDialog.remove();
      this.dailyDialog = null;
    }
  }

  closeAllDialogs() {
    this._closeStoryDialog();
    this._closeEndlessDialog();
    this._closeDailyDialog();
    this._closeShopDialog();
  }

  _openShopDialog() {
    this._closeShopDialog();
    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.id = 'lobbyShopDialog';
    dialog.innerHTML = `
      <div class="lobby-dialog-card shop-card">
        <h3>商店</h3>
        <div class="shop-header">
          <span class="shop-refresh-count">今日刷新：${this.save.account._data.daily.shopRefreshCount || 0} 次</span>
          <button class="btn" id="lobbyShopRefresh">刷新商品（${this.shop.canRefresh() ? '' : '🔒 '}${CURRENCY_ICONS.gems} 50）</button>
        </div>
        <div class="shop-grid" id="lobbyShopGrid"></div>
        <div class="lobby-dialog-actions">
          <button class="btn" id="lobbyShopClose">关闭</button>
        </div>
      </div>
    `;

    document.getElementById('lobbyScreen').appendChild(dialog);
    this.shopDialog = dialog;

    dialog.querySelector('#lobbyShopClose').addEventListener('click', () => this._closeShopDialog());
    dialog.querySelector('#lobbyShopRefresh').addEventListener('click', () => {
      const result = this.shop.refreshStock();
      if (!result.ok) {
        Toast.show(result.reason, 'error');
        return;
      }
      this._renderShopGrid(dialog);
      this._updateShopHeader(dialog);
      if (this.onRefresh) this.onRefresh();
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) this._closeShopDialog();
    });

    this._renderShopGrid(dialog);
  }

  _updateShopHeader(dialog) {
    const countEl = dialog.querySelector('.shop-refresh-count');
    if (countEl) countEl.textContent = `今日刷新：${this.save.account._data.daily.shopRefreshCount || 0} 次`;
    const refreshBtn = dialog.querySelector('#lobbyShopRefresh');
    if (refreshBtn) {
      const can = this.shop.canRefresh();
      refreshBtn.innerHTML = `刷新商品（${can ? '' : '🔒 '}${CURRENCY_ICONS.gems} 50）`;
      refreshBtn.disabled = !can;
    }
  }

  _renderShopGrid(dialog) {
    const grid = dialog.querySelector('#lobbyShopGrid');
    if (!grid) return;
    const stock = this.shop.getStock();

    if (stock.length === 0) {
      grid.innerHTML = '<div class="shop-empty">暂无商品</div>';
      return;
    }

    grid.innerHTML = stock.map(slot => {
      const item = this._getShopItem(slot.itemId);
      if (!item) return '';
      const disabled = slot.sold || this.save.account.getCurrency(item.cost.type) < item.cost.amount;
      return `
        <div class="shop-item ${slot.sold ? 'sold' : ''}" data-instance="${slot.instanceId}">
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
          <div class="shop-item-cost">
            <span class="shop-cost-type">${CURRENCY_ICONS[item.cost.type] || ''}</span>
            <span class="shop-cost-amount ${this.save.account.getCurrency(item.cost.type) >= item.cost.amount ? '' : 'insufficient'}">${item.cost.amount}</span>
          </div>
          <button class="btn btn-primary shop-buy-btn" data-instance="${slot.instanceId}" ${disabled ? 'disabled' : ''}>
            ${slot.sold ? '已售完' : '购买'}
          </button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const instanceId = btn.dataset.instance;
        const result = this.shop.buy(instanceId);
        if (!result.ok) {
          Toast.show(result.reason, 'error');
          return;
        }
        this._renderShopGrid(dialog);
        this._updateShopHeader(dialog);
        if (this.onRefresh) this.onRefresh();
        this._showShopPurchaseToast(result);
      });
    });
  }

  _showShopPurchaseToast(result) {
    const container = document.getElementById('lobbyScreen');
    if (!container) return;
    const { effectResult, item } = result;
    let msg = '';
    if (effectResult.type === 'currency') {
      msg = `获得 ${effectResult.amount} ${this._currencyName(effectResult.currency)}`;
    } else if (effectResult.type === 'inventoryExpand') {
      msg = `背包容量 +${effectResult.amount}`;
    } else if (effectResult.type === 'equip') {
      msg = `获得 ${effectResult.equip.name}`;
    }
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <span class="achievement-toast-icon">${item.icon}</span>
      <div class="achievement-toast-body">
        <div class="achievement-toast-name">购买成功：${item.name}</div>
        <div class="achievement-toast-desc">${msg}</div>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  }

  _getShopItem(id) {
    return SHOP_ITEMS.find(i => i.id === id) || null;
  }

  _currencyName(type) {
    const names = { coins: '铜币', souls: '将魂', gems: '元宝', merit: '战功', strengtheningStone: '强化石', refineStone: '精炼石' };
    return names[type] || type;
  }

  _closeShopDialog() {
    const existing = document.getElementById('lobbyShopDialog');
    if (existing) existing.remove();
    if (this.shopDialog) {
      this.shopDialog.remove();
      this.shopDialog = null;
    }
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

  _heroName(heroId) {
    const names = { zhaoyun: '赵云', diaochan: '貂蝉', dianwei: '典韦', lubu: '吕布', xuzhu: '许褚' };
    return names[heroId] || heroId;
  }

  _difficultyName(diff) {
    const names = { normal: '普通', hard: '困难', hell: '修罗' };
    return names[diff] || diff;
  }
}
