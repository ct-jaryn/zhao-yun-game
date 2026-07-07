import { EQUIP_TYPES, EQUIP_ICONS, ZHAO_YUN_EQUIP_TIERS, EQUIP_STAT_LABELS } from '../config/index.js';
import { escapeHtml } from '../utils/html.js';

const CODEX_KEYS = {
  weapons: { label: '武器', icon: '⚔️' },
  armors: { label: '铠甲', icon: '🛡️' },
  helmets: { label: '头盔', icon: '⛑️' },
  boots: { label: '靴子', icon: '👢' },
  accessories: { label: '饰品', icon: '💎' }
};

export class CodexTab {
  constructor(containerId, saveManager) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
    this.equipMap = this._buildEquipMap();
  }

  _buildEquipMap() {
    const map = {};
    ZHAO_YUN_EQUIP_TIERS.forEach((tierData, tier) => {
      for (const type of EQUIP_TYPES) {
        const data = tierData[type];
        if (!data) continue;
        map[`${data.name}_${tier}`] = { ...data, type, tier };
      }
    });
    return map;
  }

  render() {
    if (!this.container) return;

    const codex = this.save.progression._data.codex || {};
    const discovered = Object.values(codex)
      .filter(Array.isArray)
      .flat();
    const totalPossible = Object.keys(this.equipMap).length;

    this.container.innerHTML = `
      <div class="codex-panel">
        <div class="codex-header">
          <h4>装备图鉴</h4>
          <span class="codex-count">${discovered.length} / ${totalPossible}</span>
        </div>
        <div class="codex-sections">
          ${Object.entries(CODEX_KEYS).map(([key, meta]) => this._renderSection(key, meta, codex[key] || [])).join('')}
        </div>
      </div>
    `;
  }

  _renderSection(key, meta, ids) {
    return `
      <div class="codex-section">
        <div class="codex-section-title">${meta.icon} ${meta.label} <span class="codex-section-count">${ids.length}</span></div>
        <div class="codex-grid">
          ${ids.map(id => this._renderEquip(id)).join('')}
          ${ids.length === 0 ? '<div class="codex-empty">尚未收集该类型装备</div>' : ''}
        </div>
      </div>
    `;
  }

  _renderEquip(id) {
    const equip = this.equipMap[id];
    if (!equip) {
      return `<div class="codex-item unknown"><span class="codex-item-icon">?</span><div class="codex-item-name">未知装备</div></div>`;
    }
    const stats = Object.entries(equip.stats)
      .map(([k, v]) => `${EQUIP_STAT_LABELS[k] || k} +${v}`)
      .join(' · ');
    return `
      <div class="codex-item">
        <div class="codex-item-icon">${EQUIP_ICONS[equip.type]}</div>
        <div class="codex-item-name">${escapeHtml(equip.name)}</div>
        <div class="codex-item-tier">T${equip.tier + 1}</div>
        <div class="codex-item-stats">${escapeHtml(stats)}</div>
      </div>
    `;
  }
}
