import { EQUIP_TYPES, EQUIP_TYPE_TIER_IMAGES, EQUIP_ICONS, QUALITY } from '../config/index.js';
import { equipStatText, equipPower } from '../phaser/entities/Player.js';

export class InventoryModal {
  constructor(parentId, saveManager, onEquip) {
    this.parent = document.getElementById(parentId);
    this.save = saveManager;
    this.onEquip = onEquip;
    this.heroId = null;
    this.slotType = null;
    this.dialog = null;
    this.detailDialog = null;
  }

  open(heroId, slotType) {
    this.heroId = heroId;
    this.slotType = slotType;
    this._build();
  }

  close() {
    this._closeDetail();
    if (this.dialog) {
      this.dialog.remove();
      this.dialog = null;
    }
  }

  _build() {
    this.close();

    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.innerHTML = `
      <div class="lobby-dialog-card inventory-card">
        <h3>选择${this.slotType}</h3>
        <div class="inventory-list" id="inventoryList"></div>
        <div class="lobby-dialog-actions">
          <button class="btn" id="inventoryCloseBtn">关闭</button>
        </div>
      </div>
    `;

    this.dialog = dialog;
    this.parent.appendChild(dialog);

    dialog.querySelector('#inventoryCloseBtn').addEventListener('click', () => this.close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) this.close();
    });

    this._renderList();
  }

  _renderList() {
    const list = this.dialog.querySelector('#inventoryList');
    if (!list) return;
    list.innerHTML = '';

    const items = this.save.inventory.findEquipsByType(this.slotType);
    if (items.length === 0) {
      list.innerHTML = '<div class="inventory-empty">背包中没有该部位的装备</div>';
      return;
    }

    for (const { eq, index } of items) {
      const iconUrl = EQUIP_TYPE_TIER_IMAGES[this.slotType][eq.tier] || EQUIP_ICONS[this.slotType];
      const enhanceText = eq.enhanceLevel ? ` +${eq.enhanceLevel}` : '';
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.innerHTML = `
        <img src="${iconUrl}" alt="${eq.name}" onerror="this.textContent='${EQUIP_ICONS[this.slotType]}'">
        <div class="item-name" style="color:${eq.quality.color}">${eq.name}${enhanceText}</div>
        <div class="item-stats">${equipStatText(eq)}</div>
      `;
      item.addEventListener('click', () => this._openDetail(index));
      list.appendChild(item);
    }
  }

  _openDetail(index) {
    this._closeDetail();
    const eq = this.save.inventory.getEquip(index);
    if (!eq) return;

    const account = this.save.account;
    const level = eq.enhanceLevel || 0;
    const qualityIndex = ['普通', '精良', '稀有', '史诗', '传说'].indexOf(eq.quality.name);
    const maxLevel = 5 + qualityIndex * 3;
    const costCoins = Math.floor((level + 1) * (eq.tier + 1) * 50 * (1 + qualityIndex * 0.2));
    const costStones = Math.floor((level + 1) * (eq.tier + 1) * 5 * (1 + qualityIndex * 0.2));

    const detail = document.createElement('div');
    detail.className = 'lobby-dialog inventory-detail-dialog';
    detail.innerHTML = `
      <div class="lobby-dialog-card">
        <h3 style="color:${eq.quality.color}">${eq.name}${level ? ` +${level}` : ''}</h3>
        <div class="inventory-detail-stats">${equipStatText(eq)}</div>
        <div class="inventory-detail-power">战力 ${Math.floor(equipPower(eq))}</div>
        <div class="inventory-detail-meta">
          <span>品质: ${eq.quality.name}</span>
          <span>强化: ${level}/${maxLevel}</span>
        </div>
        <div class="inventory-detail-costs">
          <span>铜币: ${costCoins} 🪙</span>
          <span>强化石: ${costStones} 🔷</span>
        </div>
        <div class="inventory-detail-actions">
          <button class="btn btn-primary" id="invDetailEquip">装备</button>
          <button class="btn" id="invDetailEnhance" ${level >= maxLevel ? 'disabled' : ''}>强化</button>
          <button class="btn btn-danger" id="invDetailSalvage">分解</button>
          <button class="btn" id="invDetailClose">返回</button>
        </div>
      </div>
    `;

    this.detailDialog = detail;
    this.parent.appendChild(detail);

    detail.querySelector('#invDetailClose').addEventListener('click', () => this._closeDetail());
    detail.querySelector('#invDetailEquip').addEventListener('click', () => this._equip(index));
    detail.querySelector('#invDetailEnhance').addEventListener('click', () => this._enhance(index));
    detail.querySelector('#invDetailSalvage').addEventListener('click', () => this._salvage(index));
    detail.addEventListener('click', (e) => {
      if (e.target === detail) this._closeDetail();
    });
  }

  _closeDetail() {
    if (this.detailDialog) {
      this.detailDialog.remove();
      this.detailDialog = null;
    }
  }

  _equip(index) {
    if (this.onEquip) {
      this.onEquip(this.heroId, this.slotType, index);
    }
    this.close();
  }

  _enhance(index) {
    const result = this.save.inventory.enhance(index, this.save.account);
    if (!result.ok) {
      alert(result.reason);
      return;
    }
    this.save.persist();
    this._openDetail(index);
  }

  _salvage(index) {
    const eq = this.save.inventory.getEquip(index);
    if (!eq) return;
    if (!confirm(`确定分解 ${eq.name} 吗？`)) return;

    const reward = this.save.inventory.salvage(index);
    if (!reward) return;

    this.save.account.addCurrency('coins', reward.coins);
    this.save.account.addCurrency('strengtheningStone', reward.strengtheningStone);
    this.save.persist();
    this._closeDetail();
    this._renderList();
  }
}
