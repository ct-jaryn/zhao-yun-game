import { RunConfig } from '../game/RunConfig.js';
import { authManager } from '../auth/AuthManager.js';
import { escapeHtml } from '../utils/html.js';

export class RunController {
  constructor(save, options) {
    this.save = save;
    this.gameApp = options.gameApp;
    this.achievementChecker = options.achievementChecker;
    this.modeFooter = options.modeFooter;
    this.ui = options.ui;
    this.getCurrentHeroId = options.getCurrentHeroId;
    this.pendingAchievements = [];
    this.pendingDailyReward = null;
  }

  stageAchievements(achievements) {
    this.pendingAchievements.push(...achievements);
  }

  startRun(mode, opts = {}) {
    let heroId, skin, chapter, difficulty, challenge, heroData;

    if (mode === 'daily') {
      heroId = opts.heroId;
      heroData = this.save.heroes.getHero(heroId);
      skin = heroData.skin || 'classic';
      chapter = opts.chapter;
      difficulty = opts.difficulty;
      challenge = opts.modifier;
    } else {
      heroId = this.getCurrentHeroId ? this.getCurrentHeroId() : 'zhaoyun';
      heroData = this.save.heroes.getHero(heroId);
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
      challenge,
      heroData
    });

    this.save.heroes.recordPlay(heroId);
    this.save.persist();

    document.getElementById('lobbyScreen').classList.remove('active');

    if (!this.gameApp) {
      console.error('[RunController] gameApp 未初始化');
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
        console.warn('[RunController] 排行榜提交失败:', res.status);
      }
    } catch (err) {
      console.warn('[RunController] 排行榜提交失败:', err);
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
              <span class="achievement-name">${escapeHtml(a.name)}</span>
              <span class="achievement-desc">${escapeHtml(a.desc)}</span>
              <span class="achievement-reward">+${escapeHtml(this._formatAchievementReward(a.reward))}</span>
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
    if (this.ui && this.ui.refresh) {
      this.ui.refresh();
    }
  }
}
