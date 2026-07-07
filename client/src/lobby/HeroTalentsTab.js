import { HEROES } from '../config/index.js';
import { escapeHtml } from '../utils/html.js';
import { Toast } from './Toast.js';

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
    const totalEffects = this._collectTalentEffects(heroCfg, heroData.talentNodes);

    this.container.innerHTML = `
      <div class="talent-tree">
        <div class="talent-summary">
          <div class="talent-souls">
            <span>拥有将魂：<strong>${this.save.account.getCurrency('souls')}</strong></span>
            <button class="btn btn-small" id="talentResetBtn">重置天赋</button>
          </div>
          <div class="talent-total">
            <span>天赋总加成：</span>
            <span class="talent-total-effects">${this._formatEffect(totalEffects) || '无'}</span>
          </div>
        </div>
        ${heroCfg.talentBranches.map(branch => this._renderBranch(branch, heroData)).join('')}
      </div>
    `;

    this.container.querySelectorAll('.talent-node').forEach(node => {
      node.addEventListener('click', () => this._unlockTalent(heroId, node.dataset.node));
    });

    const resetBtn = this.container.querySelector('#talentResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this._resetTalents(heroId));
    }
  }

  _renderBranch(branch, heroData) {
    const completed = [1, 2, 3].every(i => heroData.talentNodes.includes(`${branch.id}_${i}`));
    return `
      <div class="talent-branch ${completed ? 'completed' : ''}">
        <div class="talent-branch-header">
          <div>
            <h4>${escapeHtml(branch.name)}</h4>
            <p>${escapeHtml(branch.desc)}</p>
          </div>
          ${completed ? '<span class="talent-completion">✓ 分支完成（效果 +50%）</span>' : ''}
        </div>
        <div class="talent-nodes">
          ${[1, 2, 3].map(i => {
            const nodeId = `${branch.id}_${i}`;
            const unlocked = heroData.talentNodes.includes(nodeId);
            const prevId = `${branch.id}_${i - 1}`;
            const prereqMet = i === 1 || heroData.talentNodes.includes(prevId);
            const canUnlock = !unlocked && prereqMet && this.save.account.getCurrency('souls') >= i * 50;
            const disabled = !unlocked && !canUnlock;
            return `
              <div class="talent-node ${unlocked ? 'active' : ''} ${disabled ? 'disabled' : ''}" data-node="${nodeId}">
                <span class="node-icon">${unlocked ? '✓' : i}</span>
                <span class="node-cost">${i * 50} 将魂</span>
                <span class="node-effect">${escapeHtml(this._formatEffect(branch.effects?.[i - 1]))}</span>
                ${!unlocked && !prereqMet ? '<span class="node-lock">需前置</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  _formatEffect(effect) {
    if (!effect) return '';
    const labels = {
      maxHp: '生命', maxMp: '法力', atk: '攻击', def: '防御',
      crit: '暴击', spd: '速度', hpRegen: '回血', mpRegen: '回蓝'
    };
    return Object.entries(effect)
      .map(([k, v]) => `${labels[k] || k} +${v}`)
      .join('，');
  }

  _collectTalentEffects(heroCfg, talentNodes) {
    const effects = {};
    const nodes = talentNodes || [];
    const branchTotals = {};
    const branchMaxLevels = {};

    for (const nodeId of nodes) {
      const [branchId, levelStr] = nodeId.split('_');
      const level = parseInt(levelStr, 10);
      const branch = (heroCfg.talentBranches || []).find(b => b.id === branchId);
      if (!branch || !branch.effects || level < 1 || level > branch.effects.length) continue;
      const effect = branch.effects[level - 1];
      if (!branchTotals[branchId]) branchTotals[branchId] = {};
      if (!branchMaxLevels[branchId] || level > branchMaxLevels[branchId]) {
        branchMaxLevels[branchId] = level;
      }
      for (const [k, v] of Object.entries(effect)) {
        branchTotals[branchId][k] = (branchTotals[branchId][k] || 0) + v;
      }
    }

    for (const branch of (heroCfg.talentBranches || [])) {
      const branchId = branch.id;
      const total = branchTotals[branchId] || {};
      const maxLevel = branchMaxLevels[branchId] || 0;
      const completed = maxLevel >= 3;
      const mult = completed ? 1.5 : 1;
      for (const [k, v] of Object.entries(total)) {
        effects[k] = (effects[k] || 0) + Math.floor(v * mult);
      }
    }

    return effects;
  }

  _unlockTalent(heroId, nodeId) {
    const heroData = this.save.heroes.getHero(heroId);
    if (heroData.talentNodes.includes(nodeId)) return;

    const [branchId, levelStr] = nodeId.split('_');
    const level = parseInt(levelStr, 10);
    if (level > 1) {
      const prevId = `${branchId}_${level - 1}`;
      if (!heroData.talentNodes.includes(prevId)) {
        Toast.show('需要先解锁前置天赋', 'error');
        return;
      }
    }

    const cost = level * 50;
    if (!this.save.account.consumeCurrency('souls', cost)) {
      Toast.show('将魂不足', 'error');
      return;
    }

    this.save.heroes.unlockTalent(heroId, nodeId);
    this.save.persist();
    this.render(heroId);
    if (this.onChange) this.onChange();
  }

  _resetTalents(heroId) {
    const heroData = this.save.heroes.getHero(heroId);
    if (heroData.talentNodes.length === 0) return;
    const totalSpent = heroData.talentNodes.reduce((sum, nodeId) => {
      const level = parseInt(nodeId.split('_')[1], 10);
      return sum + level * 50;
    }, 0);
    if (!confirm(`确定重置天赋吗？将返还 ${totalSpent} 将魂。`)) return;

    this.save.account.addCurrency('souls', totalSpent);
    heroData.talentNodes = [];
    this.save.persist();
    this.render(heroId);
    if (this.onChange) this.onChange();
  }
}
