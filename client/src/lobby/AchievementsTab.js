import { ACHIEVEMENTS } from '../config/index.js';
import { escapeHtml } from '../utils/html.js';

export class AchievementsTab {
  constructor(containerId, saveManager) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
  }

  render() {
    if (!this.container) return;

    const unlocked = this.save.progression._data.achievements || [];
    const total = ACHIEVEMENTS.length;
    const unlockedCount = unlocked.length;

    this.container.innerHTML = `
      <div class="achievements-panel">
        <div class="achievements-header">
          <h4>成就进度</h4>
          <span class="achievements-count">${unlockedCount} / ${total}</span>
        </div>
        <div class="achievements-progress-bar">
          <div class="achievements-progress-fill" style="width: ${total ? (unlockedCount / total * 100) : 0}%"></div>
        </div>
        <div class="achievements-list">
          ${ACHIEVEMENTS.map(ach => this._renderAchievement(ach, unlocked.includes(ach.id))).join('')}
        </div>
      </div>
    `;
  }

  _renderAchievement(ach, isUnlocked) {
    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <span class="achievement-card-icon">${ach.icon}</span>
        <div class="achievement-card-info">
          <div class="achievement-card-name">${escapeHtml(ach.name)}</div>
          <div class="achievement-card-desc">${escapeHtml(ach.desc)}</div>
          <div class="achievement-card-reward">奖励：${this._formatReward(ach.reward)}</div>
        </div>
        <span class="achievement-card-status">${isUnlocked ? '✓' : '🔒'}</span>
      </div>
    `;
  }

  _formatReward(reward = {}) {
    const labels = { coins: '铜币', souls: '将魂', gems: '元宝', merit: '功勋' };
    return Object.entries(reward)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${labels[k] || k} ${v}`)
      .join('，') || '无';
  }
}
