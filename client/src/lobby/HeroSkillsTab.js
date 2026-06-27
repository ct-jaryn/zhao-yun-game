import { HEROES, SKILLS, SKILL_ICON_IMAGES, MECHA_SKILL_ICON_IMAGES } from '../config/index.js';

export class HeroSkillsTab {
  constructor(containerId, saveManager, onChange) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
    this.onChange = onChange;
  }

  render(heroId) {
    if (!this.container) return;
    const heroData = this.save.heroes.getHero(heroId);
    const isMecha = heroData.skin === 'mecha';
    const iconMap = isMecha ? MECHA_SKILL_ICON_IMAGES : SKILL_ICON_IMAGES;

    this.container.innerHTML = `
      <div class="skills-list">
        ${SKILLS.map((sk, idx) => `
          <div class="skill-card">
            <img src="${iconMap[idx]}" alt="${sk.name}" onerror="this.style.display='none'">
            <div class="skill-info">
              <div class="skill-name">${sk.name} <span class="skill-level">Lv.${heroData.skillLevels[idx]}</span></div>
              <div class="skill-desc">${sk.desc}</div>
              <div class="skill-meta">快捷键 ${sk.key} · CD ${sk.cd}s · 消耗 ${sk.mp} MP</div>
            </div>
            <button class="btn btn-small skill-upgrade-btn" data-index="${idx}">
              升级 (${this._upgradeCost(heroData.skillLevels[idx])} 铜币)
            </button>
          </div>
        `).join('')}
      </div>
      <p class="lobby-hint">技能升级提升伤害与效果，后续版本将开放技能分支。</p>
    `;

    this.container.querySelectorAll('.skill-upgrade-btn').forEach(btn => {
      btn.addEventListener('click', () => this._upgradeSkill(heroId, parseInt(btn.dataset.index, 10)));
    });
  }

  _upgradeSkill(heroId, index) {
    const heroData = this.save.heroes.getHero(heroId);
    const cost = this._upgradeCost(heroData.skillLevels[index]);
    if (!this.save.account.consumeCurrency('coins', cost)) {
      alert('铜币不足');
      return;
    }
    this.save.heroes.updateSkillLevel(heroId, index, 1);
    this.save.persist();
    this.render(heroId);
    if (this.onChange) this.onChange();
  }

  _upgradeCost(level) {
    return level * 100;
  }
}
