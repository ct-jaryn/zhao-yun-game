import { EQUIP_TYPES, EQUIP_TYPE_TIER_IMAGES, EQUIP_ICONS, EQUIP_STAT_LABELS } from '../config/index.js';
import { equipStatText, equipPower } from '../phaser/entities/Player.js';
import { Toast } from './Toast.js';

const QUALITY_NAMES = ['普通', '精良', '稀有', '史诗', '传说'];

export class InventoryModal {
  constructor(parentId, saveManager, onEquip) {
    this.parent = document.getElementById(parentId);
    this.save = saveManager;
    this.onEquip = onEquip;
    this.heroId = null;
    this.slotType = null;
    this.dialog = null;
    this.detailDialog = null;
    this.gemPickerDialog = null;
  }

  open(heroId, slotType) {
    this.heroId = heroId;
    this.slotType = slotType;
    this._build();
  }

  close() {
    this._closeGemPicker();
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
      const refineText = eq.refineLevel ? ` ⚒${eq.refineLevel}` : '';
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.innerHTML = `
        <img src="${iconUrl}" alt="${eq.name}" onerror="this.textContent='${EQUIP_ICONS[this.slotType]}'">
        <div class="item-name" style="color:${eq.quality.color}">${eq.name}${enhanceText}${refineText}</div>
        <div class="item-stats">${equipStatText(eq)}</div>
      `;
      item.addEventListener('click', () => this._openDetail(index));
      list.appendChild(item);
    }
  }

  _openDetail(index) {
    this._closeDetail();
    this._closeGemPicker();
    const eq = this.save.inventory.getEquip(index);
    if (!eq) return;

    const account = this.save.account;
    const qualityIndex = QUALITY_NAMES.indexOf(eq.quality.name);

    const level = eq.enhanceLevel || 0;
    const maxLevel = 5 + qualityIndex * 3;
    const enhanceCoins = Math.floor((level + 1) * (eq.tier + 1) * 50 * (1 + qualityIndex * 0.2));
    const enhanceStones = Math.floor((level + 1) * (eq.tier + 1) * 5 * (1 + qualityIndex * 0.2));

    const refineLevel = eq.refineLevel || 0;
    const maxRefine = 3 + qualityIndex * 2;
    const refineCoins = Math.floor((refineLevel + 1) * (eq.tier + 1) * 80 * (1 + qualityIndex * 0.3));
    const refineStones = Math.floor((refineLevel + 1) * (eq.tier + 1) * 3 * (1 + qualityIndex * 0.3));

    const washCoins = Math.floor((eq.tier + 1) * 200 * (1 + qualityIndex * 0.4));
    const washStones = Math.floor((eq.tier + 1) * 2 * (1 + qualityIndex * 0.2));
    const maxSockets = 1 + Math.floor(qualityIndex / 2);
    const hasGems = account.gems.length > 0;
    const canInlay = hasGems && (eq.gemSockets || []).length < maxSockets;

    const detail = document.createElement('div');
    detail.className = 'lobby-dialog inventory-detail-dialog';
    detail.innerHTML = `
      <div class="lobby-dialog-card">
        <h3 style="color:${eq.quality.color}">${eq.name}${level ? ` +${level}` : ''}${refineLevel ? ` ⚒${refineLevel}` : ''}</h3>
        <div class="inventory-detail-stats">${equipStatText(eq)}</div>
        <div class="inventory-detail-power">战力 ${Math.floor(equipPower(eq))}</div>
        <div class="inventory-detail-meta">
          <span>品质: ${eq.quality.name}</span>
          <span>强化: ${level}/${maxLevel}</span>
          <span>精炼: ${refineLevel}/${maxRefine}</span>
          <span>镶嵌: ${(eq.gemSockets || []).length}/${maxSockets}</span>
        </div>
        ${this._layerText(eq)}
        <div class="inventory-detail-costs">
          <span>强化: ${enhanceCoins}🪙 ${enhanceStones}🔷</span>
          <span>精炼: ${refineCoins}🪙 ${refineStones}✨</span>
          <span>洗练: ${washCoins}🪙 ${washStones}✨</span>
        </div>
        <div class="inventory-detail-actions">
          <button class="btn btn-primary" id="invDetailEquip">装备</button>
          <button class="btn" id="invDetailEnhance" ${level >= maxLevel ? 'disabled' : ''}>强化</button>
          <button class="btn" id="invDetailRefine" ${refineLevel >= maxRefine ? 'disabled' : ''}>精炼</button>
          <button class="btn" id="invDetailWash">洗练</button>
          <button class="btn" id="invDetailInlay" ${canInlay ? '' : 'disabled'}>镶嵌</button>
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
    detail.querySelector('#invDetailRefine').addEventListener('click', () => this._refine(index));
    detail.querySelector('#invDetailWash').addEventListener('click', () => this._wash(index));
    detail.querySelector('#invDetailInlay').addEventListener('click', () => this._openGemPicker(index));
    detail.querySelector('#invDetailSalvage').addEventListener('click', () => this._salvage(index));
    detail.addEventListener('click', (e) => {
      if (e.target === detail) this._closeDetail();
    });
  }

  _layerText(eq) {
    const parts = [];
    if (eq.enhanceLevel) parts.push(`强化 +${eq.enhanceLevel}`);
    if (eq.refineLevel) parts.push(`精炼 +${eq.refineLevel}`);
    if (eq.washCount) parts.push(`洗练 ${eq.washCount}次`);
    if (eq.gemSockets && eq.gemSockets.length) {
      parts.push(eq.gemSockets.map(g => `${g.icon}${g.value}${EQUIP_STAT_LABELS[g.stat]}`).join(' '));
    }
    if (parts.length === 0) return '';
    return `<div class="inventory-detail-layers">${parts.join(' · ')}</div>`;
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
      Toast.show(result.reason, 'error');
      return;
    }
    this.save.persist();
    this._openDetail(index);
  }

  _refine(index) {
    const result = this.save.inventory.refine(index, this.save.account);
    if (!result.ok) {
      Toast.show(result.reason, 'error');
      return;
    }
    this.save.persist();
    this._openDetail(index);
  }

  _wash(index) {
    const result = this.save.inventory.wash(index, this.save.account);
    if (!result.ok) {
      Toast.show(result.reason, 'error');
      return;
    }
    this.save.persist();
    this._openDetail(index);
  }

  _openGemPicker(index) {
    this._closeGemPicker();
    const eq = this.save.inventory.getEquip(index);
    const account = this.save.account;
    const maxSockets = 1 + Math.floor(QUALITY_NAMES.indexOf(eq.quality.name) / 2);
    if ((eq.gemSockets || []).length >= maxSockets) {
      Toast.show('镶嵌孔已满', 'error');
      return;
    }
    if (account.gems.length === 0) {
      Toast.show('没有可镶嵌的宝石', 'error');
      return;
    }

    const picker = document.createElement('div');
    picker.className = 'lobby-dialog inventory-detail-dialog';
    picker.innerHTML = `
      <div class="lobby-dialog-card">
        <h3>选择镶嵌宝石</h3>
        <div class="gem-grid" id="gemGrid"></div>
        <div class="lobby-dialog-actions">
          <button class="btn" id="gemPickerClose">取消</button>
        </div>
      </div>
    `;
    this.gemPickerDialog = picker;
    this.parent.appendChild(picker);

    const grid = picker.querySelector('#gemGrid');
    grid.innerHTML = account.gems.map((gem, i) => `
      <div class="gem-item" data-index="${i}">
        <div class="gem-icon">${gem.icon}</div>
        <div class="gem-name" style="color:${gem.quality.color}">${gem.name}</div>
        <div class="gem-stat">${EQUIP_STAT_LABELS[gem.stat]}+${gem.value}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.gem-item').forEach(item => {
      item.addEventListener('click', () => {
        const gemIndex = parseInt(item.dataset.index, 10);
        const gem = account.gems[gemIndex];
        const result = this.save.inventory.inlayGem(index, gem, account);
        if (!result.ok) {
          Toast.show(result.reason, 'error');
          return;
        }
        this.save.persist();
        this._closeGemPicker();
        this._openDetail(index);
      });
    });

    picker.querySelector('#gemPickerClose').addEventListener('click', () => this._closeGemPicker());
    picker.addEventListener('click', (e) => {
      if (e.target === picker) this._closeGemPicker();
    });
  }

  _closeGemPicker() {
    if (this.gemPickerDialog) {
      this.gemPickerDialog.remove();
      this.gemPickerDialog = null;
    }
  }

  _salvage(index) {
    const eq = this.save.inventory.getEquip(index);
    if (!eq) return;
    if (!confirm(`确定分解 ${eq.name} 吗？`)) return;

    const reward = this.save.inventory.salvage(index);
    if (!reward) return;

    this.save.account.addCurrency('coins', reward.coins);
    this.save.account.addCurrency('strengtheningStone', reward.strengtheningStone);
    if (reward.refineStone) this.save.account.addCurrency('refineStone', reward.refineStone);
    this.save.persist();
    this._closeDetail();
    this._renderList();
  }
}
