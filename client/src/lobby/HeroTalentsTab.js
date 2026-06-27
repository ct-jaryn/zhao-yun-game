import { HEROES } from '../config/index.js';

export class HeroTalentsTab {
  constructor(containerId, saveManager, onChange) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
    this.onChange = onChange;
  }

  render(heroId) {
    if (!this.container) return;
    const heroCfg = HEROES[heroId];
    const heroData = this.save.heroes.getHero(heroId);

    this.container.innerHTML = `
      <div class="talent-tree">
        ${heroCfg.talentBranches.map(branch => `
          <div class="talent-branch">
            <h4>${branch.name}</h4>
            <p>${branch.desc}</p>
            <div class="talent-nodes">
              ${[1, 2, 3].map(i => `
                <div class="talent-node ${heroData.talentNodes.includes(`${branch.id}_${i}`) ? 'active' : ''}" data-node="${branch.id}_${i}">
                  <span class="node-icon">${i}</span>
                  <span class="node-cost">${i * 50} 将魂</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <p class="lobby-hint">天赋树为占位框架，后续版本将接入完整效果。</p>
    `;

    this.container.querySelectorAll('.talent-node').forEach(node => {
      node.addEventListener('click', () => this._unlockTalent(heroId, node.dataset.node));
    });
  }

  _unlockTalent(heroId, nodeId) {
    const heroData = this.save.heroes.getHero(heroId);
    if (heroData.talentNodes.includes(nodeId)) return;

    const cost = parseInt(nodeId.split('_')[1], 10) * 50;
    if (!this.save.account.consumeCurrency('souls', cost)) {
      alert('将魂不足');
      return;
    }

    this.save.heroes.unlockTalent(heroId, nodeId);
    this.save.persist();
    this.render(heroId);
    if (this.onChange) this.onChange();
  }
}
