import { HEROES, EQUIP_TYPES, EQUIP_TYPE_TIER_IMAGES, EQUIP_ICONS, QUALITY } from '../config/index.js';
import { equipStatText, equipPower } from '../phaser/systems/EquipmentFactory.js';
import { escapeHtml } from '../utils/html.js';
import { InventoryModal } from './InventoryModal.js';

export class HeroEquipTab {
  constructor(containerId, saveManager, onChange) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
    this.onChange = onChange;
    this.currentHeroId = null;
    this.inventoryModal = new InventoryModal('lobbyScreen', saveManager, this._onEquip.bind(this));
  }

  render(heroId) {
    this.currentHeroId = heroId;
    if (!this.container) return;

    const heroData = this.save.heroes.getHero(heroId);
    this.container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'equip-grid';

    for (const type of EQUIP_TYPES) {
      const eq = heroData.equipment[type];
      const card = document.createElement('div');
      card.className = 'equip-slot-card' + (eq ? '' : ' empty');
      card.dataset.type = type;

      const iconUrl = eq
        ? (EQUIP_TYPE_TIER_IMAGES[type][eq.tier] || EQUIP_ICONS[type])
        : EQUIP_ICONS[type];

      const nameHtml = eq ? `${escapeHtml(eq.name)}${eq.enhanceLevel ? ' +' + eq.enhanceLevel : ''}` : '未装备';

      card.innerHTML = `
        <div class="equip-slot-type">${type}</div>
        <img class="equip-slot-icon" src="${iconUrl}" alt="${type}" onerror="this.style.display='none'; this.parentElement.querySelector('.equip-slot-name').textContent='${EQUIP_ICONS[type]}';">
        <div class="equip-slot-name" style="color:${eq ? eq.quality.color : '#888'}">${nameHtml}</div>
        <div class="equip-slot-stats">${eq ? escapeHtml(equipStatText(eq)) : '点击装备'}</div>
      `;

      card.addEventListener('click', () => this._openInventory(type));
      grid.appendChild(card);
    }

    this.container.appendChild(grid);
  }

  _openInventory(type) {
    this.inventoryModal.open(this.currentHeroId, type);
  }

  _onEquip(heroId, type, equipIndex) {
    const eq = this.save.inventory.getEquip(equipIndex);
    if (!eq) return;

    const heroData = this.save.heroes.getHero(heroId);
    const old = heroData.equipment[type];

    // 卸下旧装备到背包
    if (old) {
      this.save.inventory.addEquip(old);
    }

    // 穿上新装备
    heroData.equipment[type] = eq;
    this.save.inventory.removeEquip(equipIndex);

    this.save.persist();
    this.render(heroId);
    if (this.onChange) this.onChange();
  }
}
