import { HEROES, HERO_UNLOCK_CONDITIONS } from '../config/index.js';
import { PLAYER_AVATAR } from '../config/index.js';

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

      item.innerHTML = `
        <img class="hero-list-avatar" src="${avatarSrc}" alt="${hero.name}" onerror="this.src='${PLAYER_AVATAR}'">
        <div class="hero-list-info">
          <div class="hero-list-name">${hero.name}</div>
          <div class="hero-list-meta">${unlocked ? `Lv.${heroData.level}` : this._lockText(hero.id)}</div>
        </div>
        ${unlocked ? '' : `<div class="hero-list-lock">🔒</div>`}
      `;

      item.addEventListener('click', () => {
        if (this.save.account.isHeroUnlocked(hero.id)) {
          this._select(hero.id);
        } else {
          this._tryUnlock(hero.id);
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
      return;
    }

    if (cond.type === 'clear') {
      const cleared = this.save.progression.getHighestClearChapter() >= cond.chapter;
      if (cleared) {
        if (this.onUnlock) this.onUnlock(heroId);
      } else {
        alert(`需通关第${cond.chapter}章解锁`);
      }
      return;
    }

    if (cond.type === 'souls') {
      if (this.save.account.consumeCurrency('souls', cond.amount)) {
        if (this.onUnlock) this.onUnlock(heroId);
      } else {
        alert(`将魂不足，需要 ${cond.amount} 将魂`);
      }
    }
  }

  _getAvatarSrc(heroId, skin) {
    if (heroId === 'zhaoyun' && skin === 'mecha') return '/player_mecha/avatar.png';
    return PLAYER_AVATAR;
  }

  _lockText(heroId) {
    const cond = HERO_UNLOCK_CONDITIONS[heroId];
    if (!cond) return '未解锁';
    if (cond.type === 'free') return '点击解锁';
    if (cond.type === 'clear') return `通关第${cond.chapter}章`;
    if (cond.type === 'souls') return `将魂 ×${cond.amount}`;
    return '未解锁';
  }
}
