import { SKILLS, EQUIP_TYPES, EQUIP_TYPE_TIER_IMAGES, QUALITY, SLOT_ICON_IMAGES, REWARD_ICON_IMAGES, SKILL_ICON_IMAGES, MECHA_SKILL_ICON_IMAGES, QUALITY_STAR_IMAGE, DIAOCHAN_AVATAR, PLAYER_AVATAR } from '../config.js';
import { equipPower } from './entities/Player.js';

function equipImageUrl(eq) {
  if (!eq) return '';
  const list = EQUIP_TYPE_TIER_IMAGES[eq.type];
  return list && list[eq.tier] ? list[eq.tier] : '';
}

function equipStatText(eq) {
  const labels = { atk:'攻击', def:'防御', hp:'生命', mp:'法力', crit:'暴击', spd:'速度' };
  return Object.entries(eq.stats).map(([k, v]) => `${labels[k] || k}+${v}`).join(' ');
}

function qualityStarHtml(eq) {
  if (!eq || !eq.quality) return '';
  const idx = QUALITY.findIndex(q => q.name === eq.quality.name);
  const count = Math.max(1, idx + 1);
  const stars = Array(count).fill(`<img class="quality-star" src="${QUALITY_STAR_IMAGE}" alt="★">`).join('');
  return `<span class="quality-stars">${stars}</span>`;
}

export class UISync {
  constructor(game) {
    this.game = game;
    this.cache = {};
    this.initSkillBar();
  }

  initSkillBar() {
    const bar = document.getElementById('skillBar');
    if (!bar) return;
    bar.innerHTML = '';
    const isMecha = this.game.skin === 'mecha';
    const iconMap = isMecha ? MECHA_SKILL_ICON_IMAGES : SKILL_ICON_IMAGES;
    SKILLS.forEach((sk, idx) => {
      const el = document.createElement('div');
      el.className = 'skill-slot ready';
      el.id = `skill_${idx}`;
      el.innerHTML = `
        <img class="icon" src="${iconMap[idx]}" alt="${sk.name}" onerror="this.style.display='none'; this.parentElement.querySelector('.skill-fallback').style.display='flex';">
        <div class="skill-fallback" style="display:none;width:34px;height:34px;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:var(--gold);background:rgba(0,0,0,0.3);border-radius:3px;">${sk.name[0]}</div>
        <span class="key">${sk.key}</span>
        <span class="sname">${sk.name}</span>
        <div class="cd-ring" id="skillCd_${idx}"></div>
        <span class="mp-cost">${sk.mp}</span>
        <div class="skill-tooltip">
          <div class="t-name">${sk.name}</div>
          <div class="t-desc">${sk.desc}</div>
          <div class="t-info">CD ${sk.cd}s · 消耗 ${sk.mp} MP</div>
        </div>
      `;
      bar.appendChild(el);
    });
  }

  update(dt) {
    const p = this.game.player;
    if (!p) return;

    this.setBarText('hpBar', `${Math.ceil(p.hp)}/${p.maxHpTotal}`);
    this.setBarFill('hpBar', p.hp / p.maxHpTotal);
    this.setBarText('mpBar', `${Math.ceil(p.mp)}/${p.maxMpTotal}`);
    this.setBarFill('mpBar', p.mp / p.maxMpTotal);
    this.setBarText('expBar', `${Math.floor(p.exp)}/${p.expToLevel}`);
    this.setBarFill('expBar', p.exp / p.expToLevel);

    this.setText('lvBadge', `Lv.${p.level}`);
    this.setText('statAtk', p.atk);
    this.setText('statDef', p.def);
    this.setText('statCrit', `${p.crit}%`);
    this.setText('statSpd', Math.floor(p.speedTotal));

    this.setText('killCount', this.game.totalKills);
    this.setText('score', this.game.score);
    this.setText('timeDisplay', this.formatTime(this.game.gameTime));
    this.setText('waveNum', this.game.getPhaseName());

    for (let i = 0; i < 5; i++) {
      const sk = SKILLS[i];
      const cd = p.skillCd[i] || 0;
      const cdEl = document.getElementById(`skillCd_${i}`);
      const item = document.getElementById(`skill_${i}`);
      if (cdEl) {
        const pct = sk.cd > 0 ? cd / sk.cd : 0;
        cdEl.style.opacity = cd > 0 ? '1' : '0';
        cdEl.style.background = cd > 0
          ? `conic-gradient(rgba(0,0,0,0.75) ${pct * 360}deg, transparent ${pct * 360}deg)`
          : 'transparent';
        cdEl.textContent = cd > 0 ? cd.toFixed(1) : '';
      }
      if (item) {
        item.classList.toggle('cooldown', cd > 0);
        item.classList.toggle('no-mp', cd <= 0 && p.mp < sk.mp);
        item.classList.toggle('ready', cd <= 0 && p.mp >= sk.mp);
      }
    }

    this.updateKillLog();
    this.updateEquipSidebar(p);
    this.updateCombo(p);
    this.updateDodge(p);
    this.updateWaveCountdown();
    this.updatePickupHint();
    this.updateLowHpWarning(p);
  }

  setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = String(value);
    if (this.cache[id] !== text) {
      el.textContent = text;
      this.cache[id] = text;
    }
  }

  setBarText(id, value) {
    const container = document.getElementById(id);
    if (!container) return;
    const textEl = container.querySelector('.bar-text');
    if (!textEl) return;
    const text = String(value);
    if (this.cache[id] !== text) {
      textEl.textContent = text;
      this.cache[id] = text;
    }
  }

  setBarFill(id, ratio) {
    const container = document.getElementById(id);
    if (!container) return;
    const fill = container.querySelector('.bar-fill');
    if (fill) {
      const pct = Math.max(0, Math.min(1, ratio)) * 100;
      fill.style.width = `${pct}%`;
    }
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  updateKillLog() {
    const log = this.game.effectManager.killLog;
    const el = document.getElementById('killLog');
    if (!el || !log) return;
    const html = log.map(k => `<div class="kill-item">${k.text}</div>`).join('');
    if (this.cache['killLogHtml'] !== html) {
      el.innerHTML = html;
      el.style.display = html ? 'block' : 'none';
      this.cache['killLogHtml'] = html;
    }
  }

  updateEquipSidebar(p) {
    const el = document.getElementById('esList');
    if (!el) return;
    const html = EQUIP_TYPES.map(type => {
      const eq = p.equip[type];
      const slotIcon = SLOT_ICON_IMAGES[type];
      if (!eq) return `<div class="es-item"><img class="es-icon es-empty" src="${slotIcon}" alt="${type}"><div class="es-info"><div class="es-name" style="color:#555">未装备</div><div class="es-type">${type}</div></div></div>`;
      return `<div class="es-item"><img class="es-icon" src="${equipImageUrl(eq)}" alt="${type}"><div class="es-info"><div class="es-name" style="color:${eq.quality.color}">${qualityStarHtml(eq)} ${eq.name}</div><div class="es-type">${type}</div></div></div>`;
    }).join('');
    if (this.cache['equipSidebarHtml'] !== html) {
      el.innerHTML = html;
      this.cache['equipSidebarHtml'] = html;
    }
  }

  updatePause(p) {
    this.setText('pauseLvBadge', `Lv.${p.level}`);
    this.setText('pauseHpText', `${Math.ceil(p.hp)}/${p.maxHpTotal}`);
    this.setBarFill('pauseHpBar', p.hp / p.maxHpTotal);
    this.setText('pauseMpText', `${Math.ceil(p.mp)}/${p.maxMpTotal}`);
    this.setBarFill('pauseMpBar', p.mp / p.maxMpTotal);
    this.setText('pauseExpText', `${Math.floor(p.exp)}/${p.expToLevel}`);
    this.setBarFill('pauseExpBar', p.exp / p.expToLevel);
    this.setText('pauseAtk', p.atk);
    this.setText('pauseDef', p.def);
    this.setText('pauseCrit', `${p.crit}%`);
    this.setText('pauseSpd', Math.floor(p.speedTotal));
    this.setText('pauseKills', this.game.totalKills);
    this.setText('pauseScore', this.game.score);
    this.setText('pauseTime', this.formatTime(this.game.gameTime));
    this.updateEquipPanel(p, 'pauseEquipGrid', 'pause');
  }

  updateEquipPanel(p, containerId = 'equipGrid', variant = 'panel') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (const type of EQUIP_TYPES) {
      const eq = p.equip[type];
      const wrap = document.createElement('div');
      const slotIcon = SLOT_ICON_IMAGES[type] || '';
      if (!eq) {
        wrap.className = variant === 'pause' ? 'pause-equip-slot empty' : 'equip-slot';
        wrap.innerHTML = variant === 'pause'
          ? `<img class="pause-equip-icon" src="${slotIcon}" alt="${type}"><div class="pause-equip-info"><div class="pause-equip-name" style="color:#777">未装备</div><div class="pause-equip-type">${type}</div></div>`
          : `<img class="slot-icon" src="${slotIcon}" alt="${type}"><div class="slot-info"><div class="slot-name" style="color:#555">未装备</div><div class="slot-type">${type}</div></div>`;
      } else {
        wrap.className = variant === 'pause' ? 'pause-equip-slot' : 'equip-slot';
        wrap.innerHTML = variant === 'pause'
          ? `<img class="pause-equip-icon" src="${equipImageUrl(eq)}" alt="${type}"><div class="pause-equip-info"><div class="pause-equip-name" style="color:${eq.quality.color}">${qualityStarHtml(eq)} [${eq.quality.name}] ${eq.name}</div><div class="pause-equip-type">${type}</div><div class="pause-equip-stats">${equipStatText(eq)}</div></div>`
          : `<img class="slot-icon-img" src="${equipImageUrl(eq)}" alt="${type}"><div class="slot-info"><div class="slot-name" style="color:${eq.quality.color}">${qualityStarHtml(eq)} [${eq.quality.name}] ${eq.name}</div><div class="slot-type">${type}</div><div class="slot-stats">${equipStatText(eq)}</div></div>`;
      }
      el.appendChild(wrap);
    }
  }

  showLevelUp(rewards, onSelect) {
    const panel = document.getElementById('levelUpPanel');
    const list = document.getElementById('rewardList');
    if (!panel || !list) return;
    panel.style.display = 'block';
    list.innerHTML = '';
    rewards.forEach((r, idx) => {
      const el = document.createElement('div');
      el.className = 'reward-card';
      const rewardIcon = REWARD_ICON_IMAGES[r.id] || r.icon;
      el.innerHTML = `<div class="reward-icon"><img class="reward-icon-img" src="${rewardIcon}" alt="${r.name}"></div><div class="reward-name">${r.name}</div><div class="reward-desc">${r.desc}</div>`;
      el.addEventListener('click', () => {
        onSelect(r);
        panel.style.display = 'none';
      });
      list.appendChild(el);
    });
  }

  showDialogue(speaker, text, options = {}) {
    const box = document.getElementById('dialogueBox');
    const speakerEl = document.getElementById('dialogueSpeaker');
    const textEl = document.getElementById('dialogueText');
    const portraitEl = document.getElementById('dialoguePortrait');
    if (!box || !speakerEl || !textEl) return;

    box.style.display = 'block';
    speakerEl.textContent = speaker;
    textEl.textContent = text;
    if (portraitEl) {
      const portraitSrc = speaker === '貂蝉'
        ? DIAOCHAN_AVATAR
        : (options.portrait || PLAYER_AVATAR);
      portraitEl.src = portraitSrc;
    }

    this.dialogueCallback = options.onClose || null;

    const closeBtn = document.getElementById('dialogueContinue');
    if (closeBtn) {
      closeBtn.onclick = () => this.hideDialogue();
    }
  }

  hideDialogue() {
    const box = document.getElementById('dialogueBox');
    if (box) box.style.display = 'none';
    if (this.dialogueCallback) {
      this.dialogueCallback();
      this.dialogueCallback = null;
    }
  }

  updateCombo(p) {
    const el = document.getElementById('comboDisplay');
    const numEl = document.getElementById('comboNum');
    if (!el || !numEl) return;

    const old = parseInt(numEl.textContent, 10) || 0;
    numEl.textContent = p.combo;

    if (p.combo > 1) {
      el.classList.add('active');
      if (p.combo >= 10 && p.combo > old && p.combo % 10 === 0) {
        el.classList.remove('milestone');
        void el.offsetWidth;
        el.classList.add('milestone');
      }
    } else {
      el.classList.remove('active', 'milestone');
    }
  }

  updateDodge(p) {
    const icon = document.getElementById('dodgeIcon');
    if (!icon) return;

    icon.classList.toggle('ready', p.dodgeCd <= 0);
    let cdEl = icon.querySelector('.dodge-cd');
    if (p.dodgeCd > 0) {
      if (!cdEl) {
        cdEl = document.createElement('div');
        cdEl.className = 'dodge-cd';
        icon.appendChild(cdEl);
      }
      cdEl.textContent = p.dodgeCd.toFixed(1);
    } else if (cdEl) {
      cdEl.remove();
    }
  }

  updateWaveCountdown() {
    const pm = this.game.phaseManager;
    if (!pm) return;

    const row = document.querySelector('#scorePanel .wave-countdown');
    const value = document.getElementById('waveCountdown');
    if (!row || !value) return;

    if (pm.phase === 'soldiers') {
      row.classList.add('active');
      value.textContent = `${pm.soldierKills}/${pm.soldiersRequired}`;
    } else {
      row.classList.remove('active');
      // 非 soldiers 阶段无清兵目标，显示占位符而非误导性的 0/20
      value.textContent = '—';
    }
  }

  updatePickupHint() {
    const drop = this.game.dropManager ? this.game.dropManager.nearestDrop : null;
    const el = document.getElementById('pickupHint');
    if (!el) return;

    if (!drop || !drop.equip) {
      el.style.display = 'none';
      return;
    }

    const eq = drop.equip;
    const old = el.style.display === 'block';
    el.style.display = 'block';

    const img = document.getElementById('phImg');
    const name = document.getElementById('phName');
    const stats = document.getElementById('phStats');
    const compare = document.getElementById('phCompare');

    if (img) img.src = equipImageUrl(eq);
    if (name) {
      name.textContent = `[${eq.quality.name}] ${eq.name}`;
      name.style.color = eq.quality.color;
    }
    if (stats) stats.textContent = equipStatText(eq);
    if (compare) {
      const oldEq = this.game.player.equip[eq.type];
      const powerOld = oldEq ? equipPower(oldEq) : 0;
      const powerNew = equipPower(eq);
      if (powerNew > powerOld) {
        compare.textContent = '✓ 优于当前装备';
        compare.style.color = '#44ff44';
      } else {
        compare.textContent = '✗ 不如当前装备';
        compare.style.color = '#ff4444';
      }
    }
  }

  updateLowHpWarning(p) {
    const el = document.getElementById('lowHpWarning');
    if (!el) return;
    const ratio = p.hp / p.maxHpTotal;
    el.classList.toggle('danger', ratio > 0 && ratio <= 0.25);
  }
}
