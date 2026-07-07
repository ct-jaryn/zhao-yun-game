import { SaveManager } from '../save/SaveManager.js';
import { HEROES, PLAYER_AVATAR } from '../config/index.js';
import { RunConfig } from '../game/RunConfig.js';
import { AchievementChecker } from '../save/AchievementChecker.js';
import { escapeHtml } from '../utils/html.js';
import { HeroSidebar } from './HeroSidebar.js';
import { HeroStatsTab } from './HeroStatsTab.js';
import { HeroEquipTab } from './HeroEquipTab.js';
import { HeroSkillsTab } from './HeroSkillsTab.js';
import { HeroTalentsTab } from './HeroTalentsTab.js';
import { HeroRecordsTab } from './HeroRecordsTab.js';
import { AchievementsTab } from './AchievementsTab.js';
import { CodexTab } from './CodexTab.js';
import { LeaderboardTab } from './LeaderboardTab.js';
import { ModeFooter } from './ModeFooter.js';
import { Toast } from './Toast.js';
import { SettingsController } from './SettingsController.js';
import { CloudSaveController } from './CloudSaveController.js';
import { RunController } from './RunController.js';

export class LobbyController {
  constructor(gameApp) {
    try {
      this.gameApp = gameApp;
      this.save = SaveManager.getInstance();
      this.currentHeroId = (this.save.account.unlockedHeroes && this.save.account.unlockedHeroes[0]) || 'zhaoyun';
      this.currentTab = 'stats';
      this.achievementChecker = new AchievementChecker(this.save);

      this.sidebar = new HeroSidebar('lobbySidebar', this.save, (id) => this.selectHero(id), (id) => this.unlockHero(id));
      this.statsTab = new HeroStatsTab('tab-stats', this.save);
      this.equipTab = new HeroEquipTab('tab-equip', this.save, () => this.refresh());
      this.skillsTab = new HeroSkillsTab('tab-skills', this.save, () => this.refresh());
      this.talentsTab = new HeroTalentsTab('tab-talents', this.save, () => this.refresh());
      this.recordsTab = new HeroRecordsTab('tab-records', this.save);
      this.achievementsTab = new AchievementsTab('tab-achievements', this.save);
      this.codexTab = new CodexTab('tab-codex', this.save);
      this.leaderboardTab = new LeaderboardTab('tab-leaderboard', this.save);
      this.modeFooter = new ModeFooter('lobbyFooter', this.save, (mode, opts) => this.startRun(mode, opts), () => this.refresh());

      this.tabs = {
        stats: this.statsTab,
        equip: this.equipTab,
        skills: this.skillsTab,
        talents: this.talentsTab,
        records: this.recordsTab,
        achievements: this.achievementsTab,
        codex: this.codexTab,
        leaderboard: this.leaderboardTab
      };

      this.cloudSaveController = new CloudSaveController(this.save);
      this.settingsController = new SettingsController(this.save, this.cloudSaveController);
      this.runController = new RunController(this.save, {
        gameApp: this.gameApp,
        achievementChecker: this.achievementChecker,
        modeFooter: this.modeFooter,
        getCurrentHeroId: () => this.currentHeroId,
        ui: {
          refresh: () => this.render(),
          toast: (message, type) => Toast.show(message, type)
        }
      });

      this._bindTabs();
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
    this._checkLobbyAchievements();
  }

  _checkLobbyAchievements() {
    const unlocked = this.achievementChecker.checkAll();
    if (unlocked.length > 0) {
      this.runController.stageAchievements(unlocked);
      this._showAchievementToast(unlocked);
      this.save.persist();
    }
  }

  _showAchievementToast(achievements) {
    const container = document.getElementById('lobbyScreen');
    if (!container) return;
    for (const ach of achievements) {
      const toast = document.createElement('div');
      toast.className = 'achievement-toast';
      toast.innerHTML = `
        <span class="achievement-toast-icon">${ach.icon}</span>
        <div class="achievement-toast-body">
          <div class="achievement-toast-name">成就解锁：${escapeHtml(ach.name)}</div>
          <div class="achievement-toast-desc">${escapeHtml(ach.desc)} · +${escapeHtml(this._formatAchievementReward(ach.reward))}</div>
        </div>
      `;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
      }, 3000);
    }
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
    const gemsEl = document.getElementById('lobbyGems');

    if (rankEl) rankEl.textContent = `军阶 Lv.${this.save.account.rank}`;
    if (coinsEl) coinsEl.textContent = `🪙 ${this.save.account.getCurrency('coins')}`;
    if (soulsEl) soulsEl.textContent = `🔥 ${this.save.account.getCurrency('souls')}`;
    if (stonesEl) stonesEl.textContent = `🔷 ${this.save.account.getCurrency('strengtheningStone')}`;
    if (meritEl) meritEl.textContent = `🎖️ ${this.save.account.getCurrency('merit')}`;
    if (gemsEl) gemsEl.textContent = `💎 ${this.save.account.getCurrency('gems')}`;
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
        mode: 'story',
        heroData
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
        return `<button class="skin-btn ${active}" data-skin="${skinId}" ${unlocked ? '' : 'disabled'}>${escapeHtml(skinCfg.name)} ${lock}</button>`;
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

  setUserInfo(userInfo) {
    if (!userInfo) return;
    const usernameEl = document.getElementById('lobbyUsername');
    if (usernameEl) usernameEl.textContent = userInfo.username || '';
    const logoutBtn = document.getElementById('lobbyLogoutBtn');
    if (logoutBtn && window.coverController) {
      logoutBtn.addEventListener('click', () => window.coverController.logout());
    }
  }

  _renderCurrentTab() {
    const tab = this.tabs[this.currentTab];
    if (tab && tab.render) {
      tab.render(this.currentHeroId);
    }
  }

  startRun(mode, opts = {}) {
    this.runController.startRun(mode, opts);
  }

  handleRunResult(result) {
    this.runController.handleRunResult(result);
  }

  _returnToLobby() {
    this.runController._returnToLobby();
  }

  _formatAchievementReward(reward = {}) {
    return Object.entries(reward)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => {
        const labels = { coins: '铜币', souls: '将魂', gems: '元宝', merit: '功勋' };
        return `${labels[k] || k} ${v}`;
      })
      .join('，');
  }
}
