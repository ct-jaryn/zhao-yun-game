import { HEROES } from '../config/index.js';
import { RunConfig } from '../game/RunConfig.js';
import { escapeHtml } from '../utils/html.js';

export class HeroStatsTab {
  constructor(containerId, saveManager) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
  }

  render(heroId) {
    if (!this.container) return;
    const heroCfg = HEROES[heroId];
    if (!heroCfg) return;

    const heroData = this.save.heroes.getHero(heroId);
    const runConfig = new RunConfig({ heroId, skin: heroData.skin, chapter: 1, difficulty: 'normal', mode: 'story', heroData });
    const stats = runConfig.toCombatStats();
    const power = this._calcPower(stats, heroCfg);

    this.container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">生命</div><div class="stat-value">${stats.maxHp}</div></div>
        <div class="stat-card"><div class="stat-label">法力</div><div class="stat-value">${stats.maxMp}</div></div>
        <div class="stat-card"><div class="stat-label">攻击</div><div class="stat-value">${stats.atk}</div></div>
        <div class="stat-card"><div class="stat-label">防御</div><div class="stat-value">${stats.def}</div></div>
        <div class="stat-card"><div class="stat-label">暴击</div><div class="stat-value">${stats.crit}%</div></div>
        <div class="stat-card"><div class="stat-label">移速</div><div class="stat-value">${stats.spd}</div></div>
      </div>
      <div class="hero-passive">
        <h4>${escapeHtml(heroCfg.passive.name)}</h4>
        <p>${escapeHtml(heroCfg.passive.description)}</p>
      </div>
      <div class="hero-passive">
        <h4>战力</h4>
        <p>${power}</p>
      </div>
    `;
  }

  _calcPower(stats, heroCfg) {
    return Math.floor(
      stats.maxHp * 0.5 +
      stats.maxMp * 0.3 +
      stats.atk * 4 +
      stats.def * 3 +
      stats.crit * 10 +
      stats.spd * 0.5
    );
  }
}
