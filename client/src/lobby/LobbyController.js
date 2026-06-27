import { SaveManager } from '../save/SaveManager.js';
import { HEROES, PLAYER_AVATAR } from '../config/index.js';
import { RunConfig } from '../game/RunConfig.js';
import { HeroSidebar } from './HeroSidebar.js';
import { HeroStatsTab } from './HeroStatsTab.js';
import { HeroEquipTab } from './HeroEquipTab.js';
import { HeroSkillsTab } from './HeroSkillsTab.js';
import { HeroTalentsTab } from './HeroTalentsTab.js';
import { HeroRecordsTab } from './HeroRecordsTab.js';
import { ModeFooter } from './ModeFooter.js';

export class LobbyController {
  constructor(gameApp) {
    try {
      this.gameApp = gameApp;
      this.save = SaveManager.getInstance();
      this.currentHeroId = (this.save.account.unlockedHeroes && this.save.account.unlockedHeroes[0]) || 'zhaoyun';
      this.currentTab = 'stats';

      this.sidebar = new HeroSidebar('lobbySidebar', this.save, (id) => this.selectHero(id), (id) => this.unlockHero(id));
      this.statsTab = new HeroStatsTab('tab-stats', this.save);
      this.equipTab = new HeroEquipTab('tab-equip', this.save, () => this.refresh());
      this.skillsTab = new HeroSkillsTab('tab-skills', this.save, () => this.refresh());
      this.talentsTab = new HeroTalentsTab('tab-talents', this.save, () => this.refresh());
      this.recordsTab = new HeroRecordsTab('tab-records', this.save);
      this.modeFooter = new ModeFooter('lobbyFooter', this.save, (mode, opts) => this.startRun(mode, opts));

      this.tabs = {
        stats: this.statsTab,
        equip: this.equipTab,
        skills: this.skillsTab,
        talents: this.talentsTab,
        records: this.recordsTab
      };

      this._bindTabs();
      this._bindSettings();
      this.render();
    } catch (err) {
      console.error('[LobbyController] 初始化失败:', err);
      throw err;
    }
  }

  render() {
    this._renderTopbar();
    this._renderPreview();
    this.sidebar.setSelected(this.currentHeroId);
    this._renderCurrentTab();
    this.modeFooter.render();
  }

  refresh() {
    this._renderTopbar();
    this._renderPreview();
    this._renderCurrentTab();
  }

  selectHero(id) {
    if (!this.save.account.isHeroUnlocked(id)) return;
    this.currentHeroId = id;
    this.sidebar.setSelected(id);
    this._renderPreview();
    this._renderCurrentTab();
  }

  unlockHero(id) {
    if (this.save.account.isHeroUnlocked(id)) return;
    this.save.account.unlockHero(id);
    this.save.heroes.addHero(id);
    this.save.persist();
    this.currentHeroId = id;
    this.render();
  }

  changeSkin(skin) {
    const heroData = this.save.heroes.getHero(this.currentHeroId);
    if (!this.save.account.isSkinUnlocked(this.currentHeroId, skin)) return;
    heroData.skin = skin;
    this.save.persist();
    this._renderPreview();
    this.sidebar.render();
  }

  _renderTopbar() {
    const rankEl = document.getElementById('lobbyRank');
    const coinsEl = document.getElementById('lobbyCoins');
    const soulsEl = document.getElementById('lobbySouls');
    const stonesEl = document.getElementById('lobbyStones');
    const meritEl = document.getElementById('lobbyMerit');

    if (rankEl) rankEl.textContent = `军阶 Lv.${this.save.account.rank}`;
    if (coinsEl) coinsEl.textContent = `🪙 ${this.save.account.getCurrency('coins')}`;
    if (soulsEl) soulsEl.textContent = `🔥 ${this.save.account.getCurrency('souls')}`;
    if (stonesEl) stonesEl.textContent = `🔷 ${this.save.account.getCurrency('strengtheningStone')}`;
    if (meritEl) meritEl.textContent = `🎖️ ${this.save.account.getCurrency('merit')}`;
  }

  _renderPreview() {
    const heroCfg = HEROES[this.currentHeroId];
    const heroData = this.save.heroes.getHero(this.currentHeroId);
    if (!heroCfg) return;

    const avatarEl = document.getElementById('lobbyHeroAvatar');
    const nameEl = document.getElementById('lobbyHeroName');
    const levelEl = document.getElementById('lobbyHeroLevel');
    const powerEl = document.getElementById('lobbyHeroPower');
    const descEl = document.getElementById('lobbyHeroDesc');

    if (avatarEl) {
      avatarEl.src = this._getAvatarSrc(this.currentHeroId, heroData.skin);
    }
    if (nameEl) nameEl.textContent = `${heroCfg.name} · ${heroCfg.title}`;
    if (levelEl) levelEl.textContent = `Lv.${heroData.level}`;
    if (descEl) descEl.textContent = heroCfg.description;

    if (powerEl) {
      const runConfig = new RunConfig({
        heroId: this.currentHeroId,
        skin: heroData.skin,
        chapter: 1,
        difficulty: 'normal',
        mode: 'story'
      });
      const stats = runConfig.toCombatStats();
      const power = Math.floor(stats.maxHp * 0.5 + stats.maxMp * 0.3 + stats.atk * 4 + stats.def * 3 + stats.crit * 10 + stats.spd * 0.5);
      powerEl.textContent = `战力 ${power}`;
    }

    this._renderSkinSelector();
  }

  _getAvatarSrc(heroId, skin) {
    if (heroId === 'zhaoyun' && skin === 'mecha') return '/player_mecha/avatar.png';
    return PLAYER_AVATAR;
  }

  _renderSkinSelector() {
    const heroCfg = HEROES[this.currentHeroId];
    const heroData = this.save.heroes.getHero(this.currentHeroId);
    const preview = document.getElementById('lobbyPreview');
    if (!preview) return;

    let selector = preview.querySelector('.skin-selector');
    if (!selector) {
      selector = document.createElement('div');
      selector.className = 'skin-selector';
      preview.appendChild(selector);
    }

    const skins = Object.entries(heroCfg.skins);
    if (skins.length <= 1) {
      selector.innerHTML = '';
      return;
    }

    selector.innerHTML = `
      <span class="skin-label">皮肤:</span>
      ${skins.map(([skinId, skinCfg]) => {
        const unlocked = this.save.account.isSkinUnlocked(this.currentHeroId, skinId);
        const active = heroData.skin === skinId ? 'active' : '';
        const lock = unlocked ? '' : '🔒';
        return `<button class="skin-btn ${active}" data-skin="${skinId}" ${unlocked ? '' : 'disabled'}>${skinCfg.name} ${lock}</button>`;
      }).join('')}
    `;

    selector.querySelectorAll('.skin-btn').forEach(btn => {
      btn.addEventListener('click', () => this.changeSkin(btn.dataset.skin));
    });
  }

  _bindTabs() {
    const tabButtons = document.querySelectorAll('#lobbyTabs .lobby-tab');
    const tabContents = document.querySelectorAll('#lobbyScreen .lobby-tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.currentTab = tab;

        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');

        const content = document.getElementById(`tab-${tab}`);
        if (content) content.classList.add('active');

        this._renderCurrentTab();
      });
    });
  }

  _bindSettings() {
    const btn = document.getElementById('lobbySettingsBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const reset = confirm('确定要重置所有存档吗？此操作不可恢复。');
        if (reset) {
          this.save.resetAll();
          location.reload();
        }
      });
    }
  }

  _renderCurrentTab() {
    const tab = this.tabs[this.currentTab];
    if (tab && tab.render) {
      tab.render(this.currentHeroId);
    }
  }

  startRun(mode, opts = {}) {
    const heroData = this.save.heroes.getHero(this.currentHeroId);
    const skin = heroData.skin || 'classic';

    const runConfig = new RunConfig({
      heroId: this.currentHeroId,
      skin,
      chapter: opts.chapter || 1,
      difficulty: opts.difficulty || 'normal',
      mode
    });

    this.save.heroes.recordPlay(this.currentHeroId);
    this.save.persist();

    document.getElementById('lobbyScreen').classList.remove('active');

    if (!this.gameApp) {
      console.error('[LobbyController] gameApp 未初始化');
      return;
    }

    this.gameApp.startRun(runConfig, (result) => this.handleRunResult(result));
  }

  handleRunResult(result) {
    const save = this.save;

    // 经验与货币
    save.heroes.addHeroExp(result.heroId, result.expGained);
    save.account.addCurrency('coins', result.coinsGained);
    save.account.addCurrency('souls', result.soulsGained);
    save.account.addRankExp(Math.floor(result.expGained * 0.1));

    // 掉落装备
    for (const eq of result.drops || []) {
      save.inventory.addEquip(eq);
      save.progression.discoverEquip(eq);
    }

    // 通关记录
    save.heroes.recordRun(result.heroId, result);
    if (result.cleared) {
      save.progression.recordClear(result.chapter, result.difficulty, result.heroId);
      if (result.mode === 'story') {
        save.account.unlockChapter(result.chapter + 1);
      }
    }

    save.persist();

    // 延迟返回大厅，让玩家看到结算画面
    setTimeout(() => {
      this._showResultDialog(result);
    }, 1500);
  }

  _showResultDialog(result) {
    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.id = 'lobbyResultDialog';

    const title = result.cleared ? '战斗胜利' : '战斗失败';
    const m = Math.floor(result.time / 60);
    const s = Math.floor(result.time % 60);

    dialog.innerHTML = `
      <div class="lobby-dialog-card">
        <h3 id="lobbyResultTitle">${title}</h3>
        <div class="lobby-result-body">
          <div class="result-row"><span class="label">击杀</span><span class="value">${result.kills}</span></div>
          <div class="result-row"><span class="label">得分</span><span class="value">${result.score}</span></div>
          <div class="result-row"><span class="label">时间</span><span class="value">${m}分${s.toString().padStart(2, '0')}秒</span></div>
          <div class="result-row"><span class="label">英雄等级</span><span class="value">Lv.${result.runLevel}</span></div>
          <div class="result-rewards">
            <span class="result-reward">经验 +${result.expGained}</span>
            <span class="result-reward">铜币 +${result.coinsGained}</span>
            <span class="result-reward">将魂 +${result.soulsGained}</span>
            <span class="result-reward">装备 ×${(result.drops || []).length}</span>
          </div>
        </div>
        <div class="lobby-dialog-actions">
          <button class="btn btn-primary" id="lobbyResultConfirm">返回大厅</button>
        </div>
      </div>
    `;

    document.getElementById('lobbyScreen').appendChild(dialog);
    dialog.querySelector('#lobbyResultConfirm').addEventListener('click', () => {
      dialog.remove();
      this._returnToLobby();
    });
  }

  _returnToLobby() {
    if (this.gameApp) {
      this.gameApp.stopGame();
    }
    this.modeFooter.closeAllDialogs();
    const resultDialog = document.getElementById('lobbyResultDialog');
    if (resultDialog) resultDialog.remove();
    document.getElementById('lobbyScreen').classList.add('active');
    this.render();
  }
}
