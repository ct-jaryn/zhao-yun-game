import { HEROES } from '../config/index.js';
import { escapeHtml } from '../utils/html.js';

export class HeroRecordsTab {
  constructor(containerId, saveManager) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
  }

  render(heroId) {
    if (!this.container) return;
    const heroData = this.save.heroes.getHero(heroId);
    const records = heroData.records;

    this.container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">最高章节</div><div class="stat-value">${records.highestChapter > 0 ? `第${records.highestChapter}章` : '无'}</div></div>
        <div class="stat-card"><div class="stat-label">总击杀</div><div class="stat-value">${records.totalKills}</div></div>
        <div class="stat-card"><div class="stat-label">总得分</div><div class="stat-value">${records.totalScore}</div></div>
        <div class="stat-card"><div class="stat-label">最高连击</div><div class="stat-value">${records.bestCombo}</div></div>
        <div class="stat-card"><div class="stat-label">战斗场次</div><div class="stat-value">${records.playCount}</div></div>
        <div class="stat-card"><div class="stat-label">最高难度</div><div class="stat-value">${records.highestDifficulty === 'normal' ? '普通' : escapeHtml(records.highestDifficulty)}</div></div>
      </div>
      <div class="hero-passive">
        <h4>成就徽章</h4>
        <p>后续版本将展示该英雄专属成就。</p>
      </div>
    `;
  }
}
