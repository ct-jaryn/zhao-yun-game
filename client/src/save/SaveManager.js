import {
  SAVE_VERSION,
  createDefaultSave,
  createDefaultSettings
} from './schemas.js';
import { Account } from './Account.js';
import { HeroCollection } from './HeroCollection.js';
import { Inventory } from './Inventory.js';
import { Progression } from './Progression.js';

const STORAGE_KEY = 'zhaoyun_save';
const LEGACY_CHAPTER4_KEY = 'zhaoyun_chapter4_unlocked';

let instance = null;

export class SaveManager {
  constructor() {
    if (instance) return instance;
    instance = this;

    this._raw = this._loadRaw();
    this._ensureValidRaw();
    this.account = new Account(this._raw.account);
    this.heroes = new HeroCollection(this._raw.heroes);
    this.inventory = new Inventory(this._raw.inventory);
    this.progression = new Progression(this._raw.progression);
    this.settings = this._raw.settings || createDefaultSettings();
    this._raw.settings = this.settings;

    this._autoSaveInterval = setInterval(() => this.persist(), 30000);
  }

  static getInstance() {
    return new SaveManager();
  }

  static resetInstance() {
    instance = null;
  }

  _loadRaw() {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) {
        const fresh = createDefaultSave();
        this._applyLegacyMigration(fresh);
        return fresh;
      }
      const parsed = JSON.parse(json);
      const migrated = this._migrate(parsed);
      this._applyLegacyMigration(migrated);
      return migrated;
    } catch (err) {
      console.warn('[SaveManager] 读取存档失败，使用默认存档:', err);
      return createDefaultSave();
    }
  }

  _ensureValidRaw() {
    const fresh = createDefaultSave();
    if (!this._raw || typeof this._raw !== 'object') {
      this._raw = fresh;
      return;
    }
    if (!this._raw.account) this._raw.account = fresh.account;
    if (!this._raw.heroes) this._raw.heroes = fresh.heroes;
    if (!this._raw.inventory) this._raw.inventory = fresh.inventory;
    if (!this._raw.progression) this._raw.progression = fresh.progression;
    if (!this._raw.settings) this._raw.settings = fresh.settings;

    // 确保账号关键字段存在
    const acc = this._raw.account;
    if (!Array.isArray(acc.unlockedHeroes)) acc.unlockedHeroes = fresh.account.unlockedHeroes;
    if (!Array.isArray(acc.unlockedChapters)) acc.unlockedChapters = fresh.account.unlockedChapters;
    if (!acc.unlockedSkins) acc.unlockedSkins = fresh.account.unlockedSkins;
    if (!acc.currencies) acc.currencies = fresh.account.currencies;
    if (!acc.daily) acc.daily = fresh.account.daily;
    if (!acc.daily.shopStock) acc.daily.shopStock = [];
    if (typeof acc.daily.shopRefreshCount !== 'number') acc.daily.shopRefreshCount = 0;
    if (!acc.daily.shopDate) acc.daily.shopDate = '';
    if (!Array.isArray(acc.gems)) acc.gems = [];
  }

  _applyLegacyMigration(data) {
    try {
      const legacy = localStorage.getItem(LEGACY_CHAPTER4_KEY);
      if (legacy === 'true' && data.account && !data.account.unlockedChapters.includes(4)) {
        data.account.unlockedChapters.push(4);
        console.log('[SaveManager] 已迁移旧版第四章解锁记录');
      }
    } catch (e) {}
  }

  _migrate(data) {
    if (!data || typeof data !== 'object') {
      return createDefaultSave();
    }

    const version = data.version || 0;
    if (version >= SAVE_VERSION) {
      return data;
    }

    const fresh = createDefaultSave();

    if (version === 0) {
      // 旧版只有 chapter4_unlocked，已在 _applyLegacyMigration 处理
      return fresh;
    }

    return fresh;
  }

  persist() {
    try {
      this._raw.account = this.account.toJSON();
      this._raw.heroes = this.heroes.toJSON();
      this._raw.inventory = this.inventory.toJSON();
      this._raw.progression = this.progression.toJSON();
      this._raw.settings = this.settings;
      this._raw.version = SAVE_VERSION;
      this._raw.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._raw));
      return true;
    } catch (err) {
      console.error('[SaveManager] 保存失败:', err);
      return false;
    }
  }

  exportToString() {
    this.persist();
    return btoa(encodeURIComponent(JSON.stringify(this._raw)));
  }

  importFromString(str) {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(str)));
      const migrated = this._migrate(decoded);
      this._raw = migrated;
      this.account = new Account(this._raw.account);
      this.heroes = new HeroCollection(this._raw.heroes);
      this.inventory = new Inventory(this._raw.inventory);
      this.progression = new Progression(this._raw.progression);
      this.settings = this._raw.settings || createDefaultSettings();
      this._raw.settings = this.settings;
      this.persist();
      return true;
    } catch (err) {
      console.error('[SaveManager] 导入存档失败:', err);
      return false;
    }
  }

  resetAll() {
    this._raw = createDefaultSave();
    this.account = new Account(this._raw.account);
    this.heroes = new HeroCollection(this._raw.heroes);
    this.inventory = new Inventory(this._raw.inventory);
    this.progression = new Progression(this._raw.progression);
    this.settings = this._raw.settings;
    this.persist();
  }

  toJSON() {
    return {
      version: SAVE_VERSION,
      updatedAt: Date.now(),
      account: this.account.toJSON(),
      heroes: this.heroes.toJSON(),
      inventory: this.inventory.toJSON(),
      progression: this.progression.toJSON(),
      settings: this.settings
    };
  }
}
