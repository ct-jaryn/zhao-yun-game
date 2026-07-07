import { HEROES, HERO_UNLOCK_CONDITIONS, PLAYER_AVATAR } from '../config/index.js';
import { escapeHtml } from '../utils/html.js';
import { Toast } from './Toast.js';

export class HeroSidebar {
  constructor(containerId, saveManager, onSelect, onUnlock) {
    this.container = document.getElementById(containerId);
    this.save = saveManager;
    this.onSelect = onSelect;
    this.onUnlock = onUnlock;
    this.selectedHeroId = null;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '<h3>英雄</h3>';

    const list = document.createElement('div');
    list.className = 'hero-list';

    const heroes = Object.values(HEROES);
    for (const hero of heroes) {
      const unlocked = this.save.account.isHeroUnlocked(hero.id);
      const heroData = this.save.heroes.getHero(hero.id);
      const item = document.createElement('div');
      item.className = 'hero-list-item' + (unlocked ? '' : ' locked');
      item.dataset.heroId = hero.id;

      if (this.selectedHeroId === hero.id) {
        item.classList.add('active');
      }

      const avatarSrc = this._getAvatarSrc(hero.id, heroData.skin);
      const lockInfo = this._lockInfo(hero.id);

      item.innerHTML = `
        <img class="hero-list-avatar" src="${avatarSrc}" alt="${escapeHtml(hero.name)}" onerror="this.src='${PLAYER_AVATAR}'">
        <div class="hero-list-info">
          <div class="hero-list-name">${escapeHtml(hero.name)}</div>
          <div class="hero-list-meta">${unlocked ? `Lv.${heroData.level}` : escapeHtml(lockInfo.text)}</div>
        </div>
        ${unlocked ? '<div class="hero-list-check">●</div>' : `<button class="btn btn-small hero-unlock-btn" data-hero="${hero.id}" ${lockInfo.canUnlock ? '' : 'disabled'}>${escapeHtml(lockInfo.btnText)}</button>`}
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.hero-unlock-btn')) {
          this._tryUnlock(hero.id);
          return;
        }
        if (this.save.account.isHeroUnlocked(hero.id)) {
          this._select(hero.id);
        } else {
          Toast.show(lockInfo.hint, 'info');
        }
      });

      list.appendChild(item);
    }

    this.container.appendChild(list);
  }

  setSelected(heroId) {
    this.selectedHeroId = heroId;
    this.render();
  }

  _select(heroId) {
    this.selectedHeroId = heroId;
    this.render();
    if (this.onSelect) this.onSelect(heroId);
  }

  _tryUnlock(heroId) {
    const cond = HERO_UNLOCK_CONDITIONS[heroId];
    if (!cond) return;

    if (cond.type === 'free') {
      if (this.onUnlock) this.onUnlock(heroId);
      Toast.show(`${HEROES[heroId].name} 已解锁`, 'success');
      return;
    }

    if (cond.type === 'clear') {
      const cleared = this.save.progression.getHighestClearChapter() >= cond.chapter;
      if (cleared) {
        if (this.onUnlock) this.onUnlock(heroId);
        Toast.show(`${HEROES[heroId].name} 已解锁`, 'success');
      } else {
        Toast.show(`需通关第 ${cond.chapter} 章解锁 ${HEROES[heroId].name}`, 'error');
      }
      return;
    }

    if (cond.type === 'souls') {
      if (this.save.account.consumeCurrency('souls', cond.amount)) {
        if (this.onUnlock) this.onUnlock(heroId);
        this.save.persist();
        Toast.show(`消耗 ${cond.amount} 将魂解锁 ${HEROES[heroId].name}`, 'success');
      } else {
        Toast.show(`将魂不足，解锁 ${HEROES[heroId].name} 需要 ${cond.amount} 将魂`, 'error');
      }
    }
  }

  _getAvatarSrc(heroId, skin) {
    if (heroId === 'zhaoyun' && skin === 'mecha') return '/player_mecha/avatar.png';
    return PLAYER_AVATAR;
  }

  _lockInfo(heroId) {
    const cond = HERO_UNLOCK_CONDITIONS[heroId];
    if (!cond) return { text: '未解锁', btnText: '解锁', hint: '未解锁', canUnlock: false };
    if (cond.type === 'free') return { text: '点击解锁', btnText: '解锁', hint: `${HEROES[heroId].name} 可免费解锁`, canUnlock: true };
    if (cond.type === 'clear') {
      const cleared = this.save.progression.getHighestClearChapter() >= cond.chapter;
      return {
        text: `通关第${cond.chapter}章`,
        btnText: cleared ? '解锁' : '未达成',
        hint: `通关第 ${cond.chapter} 章解锁 ${HEROES[heroId].name}`,
        canUnlock: cleared
      };
    }
    if (cond.type === 'souls') {
      const enough = this.save.account.getCurrency('souls') >= cond.amount;
      return {
        text: `将魂 ×${cond.amount}`,
        btnText: enough ? `解锁` : '将魂不足',
        hint: `消耗 ${cond.amount} 将魂解锁 ${HEROES[heroId].name}`,
        canUnlock: enough
      };
    }
    return { text: '未解锁', btnText: '解锁', hint: '未解锁', canUnlock: false };
  }
}
