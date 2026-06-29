import { SaveManager } from '../save/SaveManager.js';
import { authManager } from '../auth/AuthManager.js';
import { HEROES, PLAYER_AVATAR } from '../config/index.js';
import { RunConfig } from '../game/RunConfig.js';
import { AchievementChecker } from '../save/AchievementChecker.js';
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

export class LobbyController {
  constructor(gameApp) {
    try {
      this.gameApp = gameApp;
      this.save = SaveManager.getInstance();
      this.currentHeroId = (this.save.account.unlockedHeroes && this.save.account.unlockedHeroes[0]) || 'zhaoyun';
      this.currentTab = 'stats';
      this.achievementChecker = new AchievementChecker(this.save);
      this.pendingAchievements = [];

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
    this._checkLobbyAchievements();
  }

  _checkLobbyAchievements() {
    const unlocked = this.achievementChecker.checkAll();
    if (unlocked.length > 0) {
      this.pendingAchievements.push(...unlocked);
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
          <div class="achievement-toast-name">成就解锁：${ach.name}</div>
          <div class="achievement-toast-desc">${ach.desc} · +${this._formatAchievementReward(ach.reward)}</div>
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
      btn.addEventListener('click', () => this._openSettingsModal());
    }
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

  _openSettingsModal() {
    this._closeSettingsModal();
    const settings = this.save.settings || {};
    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.id = 'lobbySettingsDialog';
    dialog.innerHTML = `
      <div class="lobby-dialog-card settings-card">
        <h3>设置</h3>
        <div class="settings-body">
          <div class="setting-row">
            <label>音乐音量</label>
            <input type="range" id="settingMusicVolume" min="0" max="1" step="0.1" value="${settings.musicVolume ?? 0.7}">
            <span id="settingMusicVolumeValue">${Math.round((settings.musicVolume ?? 0.7) * 100)}%</span>
          </div>
          <div class="setting-row">
            <label>音效音量</label>
            <input type="range" id="settingSfxVolume" min="0" max="1" step="0.1" value="${settings.sfxVolume ?? 0.8}">
            <span id="settingSfxVolumeValue">${Math.round((settings.sfxVolume ?? 0.8) * 100)}%</span>
          </div>
          <div class="setting-row">
            <label>屏幕震动</label>
            <input type="checkbox" id="settingScreenShake" ${settings.screenShake !== false ? 'checked' : ''}>
          </div>
          <div class="setting-row">
            <label>显示伤害数字</label>
            <input type="checkbox" id="settingShowDamageNumbers" ${settings.showDamageNumbers !== false ? 'checked' : ''}>
          </div>
          <div class="setting-row">
            <label>语言</label>
            <select id="settingLanguage">
              <option value="zh-CN" ${settings.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
              <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>English</option>
            </select>
          </div>
          <div class="setting-row save-code-row">
            <label>存档码</label>
            <textarea id="settingSaveCode" rows="3" readonly>${this.save.exportToString()}</textarea>
            <div class="save-code-actions">
              <button class="btn" id="settingExportBtn">复制存档码</button>
              <button class="btn" id="settingImportBtn">导入存档码</button>
            </div>
          </div>
          <div class="setting-row save-code-row">
            <label>云存档（与当前账号绑定）</label>
            <div class="save-code-actions">
              <button class="btn" id="settingCloudUpload">上传存档</button>
              <button class="btn" id="settingCloudDownload">下载存档</button>
            </div>
          </div>
        </div>
        <div class="lobby-dialog-actions">
          <button class="btn btn-danger" id="settingResetBtn">重置存档</button>
          <button class="btn btn-primary" id="settingConfirmBtn">保存</button>
          <button class="btn" id="settingCancelBtn">取消</button>
        </div>
      </div>
    `;

    document.getElementById('lobbyScreen').appendChild(dialog);

    // 滑块实时显示百分比
    dialog.querySelector('#settingMusicVolume').addEventListener('input', (e) => {
      dialog.querySelector('#settingMusicVolumeValue').textContent = Math.round(e.target.value * 100) + '%';
    });
    dialog.querySelector('#settingSfxVolume').addEventListener('input', (e) => {
      dialog.querySelector('#settingSfxVolumeValue').textContent = Math.round(e.target.value * 100) + '%';
    });

    dialog.querySelector('#settingExportBtn').addEventListener('click', () => {
      const code = this.save.exportToString();
      navigator.clipboard.writeText(code).then(() => Toast.show('存档码已复制到剪贴板', 'success')).catch(() => Toast.show('复制失败', 'error'));
    });
    dialog.querySelector('#settingImportBtn').addEventListener('click', () => {
      const code = prompt('请粘贴存档码：');
      if (!code) return;
      if (this.save.importFromString(code)) {
        Toast.show('导入成功，页面将刷新', 'success');
        location.reload();
      } else {
        Toast.show('导入失败，请检查存档码', 'error');
      }
    });
    dialog.querySelector('#settingResetBtn').addEventListener('click', () => {
      const ok = confirm('确定要重置所有存档吗？此操作不可恢复。');
      if (ok) {
        this.save.resetAll();
        location.reload();
      }
    });
    dialog.querySelector('#settingCloudUpload').addEventListener('click', () => this._uploadCloudSave(dialog));
    dialog.querySelector('#settingCloudDownload').addEventListener('click', () => this._downloadCloudSave(dialog));
    dialog.querySelector('#settingConfirmBtn').addEventListener('click', () => this._saveSettings(dialog));
    dialog.querySelector('#settingCancelBtn').addEventListener('click', () => this._closeSettingsModal());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) this._closeSettingsModal();
    });
  }

  _closeSettingsModal() {
    const dialog = document.getElementById('lobbySettingsDialog');
    if (dialog) dialog.remove();
  }

  _saveSettings(dialog) {
    this.save.settings.musicVolume = parseFloat(dialog.querySelector('#settingMusicVolume').value);
    this.save.settings.sfxVolume = parseFloat(dialog.querySelector('#settingSfxVolume').value);
    this.save.settings.screenShake = dialog.querySelector('#settingScreenShake').checked;
    this.save.settings.showDamageNumbers = dialog.querySelector('#settingShowDamageNumbers').checked;
    this.save.settings.language = dialog.querySelector('#settingLanguage').value;
    this.save.persist();
    this._closeSettingsModal();
  }

  _renderCurrentTab() {
    const tab = this.tabs[this.currentTab];
    if (tab && tab.render) {
      tab.render(this.currentHeroId);
    }
  }

  startRun(mode, opts = {}) {
    let heroId, skin, chapter, difficulty, challenge;

    if (mode === 'daily') {
      heroId = opts.heroId;
      const heroData = this.save.heroes.getHero(heroId);
      skin = heroData.skin || 'classic';
      chapter = opts.chapter;
      difficulty = opts.difficulty;
      challenge = opts.modifier;
    } else {
      const heroData = this.save.heroes.getHero(this.currentHeroId);
      heroId = this.currentHeroId;
      skin = heroData.skin || 'classic';
      chapter = opts.chapter || 1;
      difficulty = opts.difficulty || 'normal';
    }

    const runConfig = new RunConfig({
      heroId,
      skin,
      chapter,
      difficulty,
      mode,
      challenge
    });

    this.save.heroes.recordPlay(heroId);
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
    const leveled = save.account.addRankExp(Math.floor(result.expGained * 0.1));
    if (leveled) {
      const capacity = save.account.consumePendingInventoryCapacity();
      if (capacity > 0) save.inventory.expandCapacity(capacity);
    }

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

    // 无尽模式记录
    if (result.mode === 'endless') {
      save.progression.recordEndless(result.time, result.kills, result.wave || 1);
    }

    // 每日挑战完成记录（通关才算完成）
    if (result.mode === 'daily' && result.cleared) {
      this.pendingDailyReward = this.modeFooter.dailyChallenge.recordCompletion(result.difficulty);
    }

    // 成就检查
    const unlockedAchievements = this.achievementChecker.checkAll(result);
    if (unlockedAchievements.length > 0) {
      this.pendingAchievements.push(...unlockedAchievements);
    }

    save.persist();

    this._submitLeaderboard(result);

    // 延迟返回大厅，让玩家看到结算画面
    setTimeout(() => {
      this._showResultDialog(result);
    }, 1500);
  }

  async _uploadCloudSave(dialog) {
    if (!authManager.isLoggedIn()) {
      Toast.show('请先登录后再上传云存档', 'error');
      return;
    }
    try {
      const res = await authManager.fetchWithAuth('/api/save/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveData: this.save.toJSON() })
      });
      const json = await res.json();
      if (json.success) {
        Toast.show('云存档上传成功', 'success');
      } else {
        Toast.show('上传失败：' + json.message, 'error');
      }
    } catch (err) {
      console.error('[LobbyController] 云存档上传失败:', err);
      Toast.show('上传失败，请检查网络或稍后再试', 'error');
    }
  }

  async _downloadCloudSave(dialog) {
    if (!authManager.isLoggedIn()) {
      Toast.show('请先登录后再下载云存档', 'error');
      return;
    }
    try {
      const res = await authManager.fetchWithAuth('/api/save');
      const json = await res.json();
      if (json.success && json.data) {
        if (this.save.importFromString(btoa(encodeURIComponent(JSON.stringify(json.data))))) {
          this.save.persist();
          Toast.show('云存档下载成功，页面将刷新', 'success');
          location.reload();
        } else {
          Toast.show('存档解析失败', 'error');
        }
      } else {
        Toast.show('下载失败：' + json.message, 'error');
      }
    } catch (err) {
      console.error('[LobbyController] 云存档下载失败:', err);
      Toast.show('下载失败，请检查网络或稍后再试', 'error');
    }
  }

  async _submitLeaderboard(result) {
    // vite preview 测试环境没有后端 API，避免 404 控制台报错
    if (import.meta.env.PROD && window.location.port === '5177') return;
    try {
      const heroNames = { zhaoyun: '赵云', diaochan: '貂蝉', dianwei: '典韦', lubu: '吕布', xuzhu: '许褚' };
      const record = {
        name: heroNames[result.heroId] || result.heroId,
        score: result.score,
        kills: result.kills,
        wave: result.wave || 1,
        level: result.runLevel,
        time: result.time
      };
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      };
      const res = authManager.isLoggedIn()
        ? await authManager.fetchWithAuth('/api/leaderboard', options)
        : await fetch('/api/leaderboard', options);
      if (!res.ok) {
        console.warn('[LobbyController] 排行榜提交失败:', res.status);
      }
    } catch (err) {
      console.warn('[LobbyController] 排行榜提交失败:', err);
    }
  }

  _showResultDialog(result) {
    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.id = 'lobbyResultDialog';

    const isEndless = result.mode === 'endless';
    const title = isEndless ? '无尽挑战结束' : (result.cleared ? '战斗胜利' : '战斗失败');
    const m = Math.floor(result.time / 60);
    const s = Math.floor(result.time % 60);
    const waveRow = isEndless
      ? `<div class="result-row"><span class="label">最高波次</span><span class="value">第 ${result.wave || 1} 波</span></div>`
      : '';

    const achievements = this.pendingAchievements.splice(0, this.pendingAchievements.length);
    const dailyReward = this.pendingDailyReward;
    this.pendingDailyReward = null;

    const achievementHtml = achievements.length
      ? `
        <div class="result-achievements">
          <h4>🏆 成就解锁</h4>
          ${achievements.map(a => `
            <div class="result-achievement-item">
              <span class="achievement-icon">${a.icon}</span>
              <span class="achievement-name">${a.name}</span>
              <span class="achievement-desc">${a.desc}</span>
              <span class="achievement-reward">+${this._formatAchievementReward(a.reward)}</span>
            </div>
          `).join('')}
        </div>
      `
      : '';

    const dailyRewardHtml = (result.mode === 'daily' && dailyReward)
      ? `
        <div class="result-daily-reward">
          <h4>📅 每日挑战奖励</h4>
          <div class="result-rewards">
            <span class="result-reward">铜币 +${dailyReward.rewards.coins}</span>
            <span class="result-reward">将魂 +${dailyReward.rewards.souls}</span>
            <span class="result-reward">元宝 +${dailyReward.rewards.gems}</span>
          </div>
        </div>
      `
      : '';

    dialog.innerHTML = `
      <div class="lobby-dialog-card">
        <h3 id="lobbyResultTitle">${title}</h3>
        <div class="lobby-result-body">
          <div class="result-row"><span class="label">击杀</span><span class="value">${result.kills}</span></div>
          <div class="result-row"><span class="label">得分</span><span class="value">${result.score}</span></div>
          ${waveRow}
          <div class="result-row"><span class="label">时间</span><span class="value">${m}分${s.toString().padStart(2, '0')}秒</span></div>
          <div class="result-row"><span class="label">英雄等级</span><span class="value">Lv.${result.runLevel}</span></div>
          <div class="result-rewards">
            <span class="result-reward">经验 +${result.expGained}</span>
            <span class="result-reward">铜币 +${result.coinsGained}</span>
            <span class="result-reward">将魂 +${result.soulsGained}</span>
            <span class="result-reward">装备 ×${(result.drops || []).length}</span>
          </div>
          ${achievementHtml}
          ${dailyRewardHtml}
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

  _formatAchievementReward(reward = {}) {
    return Object.entries(reward)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => {
        const labels = { coins: '铜币', souls: '将魂', gems: '元宝', merit: '功勋' };
        return `${labels[k] || k} ${v}`;
      })
      .join('，');
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
