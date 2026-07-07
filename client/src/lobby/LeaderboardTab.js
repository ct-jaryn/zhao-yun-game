import { escapeHtml } from '../utils/html.js';

export class LeaderboardTab {
  constructor(containerId, saveManager) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
    this.entries = [];
    this.loading = false;
    this.error = null;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="leaderboard-panel">
        <div class="leaderboard-header">
          <h4>天下英雄榜</h4>
          <button class="btn btn-small" id="leaderboardRefreshBtn">刷新</button>
        </div>
        <div class="leaderboard-list" id="leaderboardList">
          ${this.loading ? '<div class="leaderboard-empty">加载中...</div>' : this._renderRows()}
        </div>
      </div>
    `;

    const refreshBtn = this.container.querySelector('#leaderboardRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.load());
    }

    if (this.entries.length === 0 && !this.loading && !this.error) {
      this.load();
    }
  }

  async load() {
    this.loading = true;
    this.error = null;
    this.render();
    try {
      const res = await fetch('/api/leaderboard?limit=20');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.entries = json.data;
      } else {
        this.error = '排行榜数据异常';
      }
    } catch (err) {
      this.error = '连接排行榜失败';
      console.error('[LeaderboardTab] 加载失败:', err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  _renderRows() {
    if (this.error) return `<div class="leaderboard-empty">${escapeHtml(this.error)}</div>`;
    if (this.entries.length === 0) return '<div class="leaderboard-empty">暂无排行数据</div>';

    return `
      <div class="leaderboard-row leaderboard-head">
        <span class="lb-rank">排名</span>
        <span class="lb-name">英雄</span>
        <span class="lb-score">得分</span>
        <span class="lb-kills">击杀</span>
        <span class="lb-level">等级</span>
      </div>
      ${this.entries.map((entry, index) => `
        <div class="leaderboard-row ${index < 3 ? 'top-' + (index + 1) : ''}">
          <span class="lb-rank">${this._rankLabel(index + 1)}</span>
          <span class="lb-name">${escapeHtml(entry.name)}</span>
          <span class="lb-score">${entry.score}</span>
          <span class="lb-kills">${entry.kills}</span>
          <span class="lb-level">Lv.${entry.level}</span>
        </div>
      `).join('')}
    `;
  }

  _rankLabel(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  }
}
