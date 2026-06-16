import { SKILLS, EQUIP_TYPES, EQUIP_ICONS } from './config.js';
import { equipStatText } from './entities/player.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.initSkillBar();
  }

  initSkillBar() {
    const bar = document.getElementById('skillBar');
    bar.innerHTML = '';
    SKILLS.forEach((sk, i) => {
      const slot = document.createElement('div');
      slot.className = 'skill-slot ready';
      slot.id = `skill${i}`;
      slot.dataset.idx = i;
      slot.innerHTML = `
        <span class="key">${sk.key}</span>
        <span class="icon">${sk.icon}</span>
        <span class="sname">${sk.name}</span>
        <canvas class="cd-ring" width="52" height="58"></canvas>
        <span class="mp-cost">${sk.mp}</span>
        <div class="skill-tooltip">
          <div class="t-name">${sk.name}</div>
          <div class="t-desc">${sk.desc}</div>
          <div class="t-info">伤害: ${Math.round(sk.dmgMult*100)}% | CD: ${sk.cd}s | MP: ${sk.mp}</div>
        </div>
      `;
      slot.addEventListener('click', () => {
        if (this.game && this.game.running && !this.game.paused && !this.game.levelUpOpen) {
          this.game.player.useSkill(i, this.game);
        }
      });
      bar.appendChild(slot);
    });
  }

  update() {
    const p = this.game.player;
    document.getElementById('lvBadge').textContent = `Lv.${p.level}`;

    this.setBar('hpBar', p.hp, p.maxHpTotal);
    this.setBar('mpBar', p.mp, p.maxMpTotal);
    this.setBar('expBar', p.exp, p.expToLevel);

    document.getElementById('statAtk').textContent = p.atk;
    document.getElementById('statDef').textContent = p.def;
    document.getElementById('statCrit').textContent = p.crit;
    document.getElementById('statSpd').textContent = Math.round(p.speedTotal);

    document.getElementById('waveNum').textContent = this.game.wave;
    document.getElementById('killCount').textContent = this.game.totalKills;
    document.getElementById('comboCount').textContent = p.combo;
    document.getElementById('score').textContent = Math.floor(this.game.score);
    const mins = Math.floor(this.game.gameTime / 60);
    const secs = Math.floor(this.game.gameTime % 60);
    document.getElementById('timeDisplay').textContent = `${mins}:${secs.toString().padStart(2,'0')}`;

    const wc = document.getElementById('waveCountdown');
    const wrow = wc.parentElement;
    if (this.game.enemies.filter(e => !e.dead).length === 0 && this.game.waveTimer > 0) {
      wc.textContent = this.game.waveTimer.toFixed(1) + 's';
      wrow.classList.add('active');
    } else {
      wrow.classList.remove('active');
    }

    const comboEl = document.getElementById('comboDisplay');
    if (p.combo >= 3) {
      comboEl.style.display = 'block';
      document.getElementById('comboNum').textContent = p.combo;
      document.getElementById('comboNum').style.fontSize = Math.min(48 + p.combo * 2, 80) + 'px';
      if ([10, 25, 50].includes(p.combo)) comboEl.classList.add('milestone');
      else comboEl.classList.remove('milestone');
    } else {
      comboEl.style.display = 'none';
      comboEl.classList.remove('milestone');
    }

    for (let i = 0; i < 5; i++) {
      const el = document.getElementById(`skill${i}`);
      const cd = p.skillCd[i];
      const cvs = el.querySelector('.cd-ring');
      const c = cvs.getContext('2d');
      c.clearRect(0, 0, 52, 58);
      const maxCd = SKILLS[i].cd * (1 - p.bonusCdr);
      if (cd > 0) {
        el.classList.remove('ready');
        const frac = maxCd > 0 ? cd / maxCd : 0;
        c.fillStyle = 'rgba(0,0,0,0.55)';
        c.fillRect(0, 58 * (1 - frac), 52, 58 * frac);
        c.fillStyle = '#fff';
        c.font = 'bold 14px sans-serif';
        c.textAlign = 'center';
        c.fillText(cd.toFixed(1), 26, 34);
      } else {
        el.classList.add('ready');
      }
    }

    const dodgeIcon = document.getElementById('dodgeIcon');
    if (p.dodgeCd > 0) {
      dodgeIcon.classList.remove('ready');
      let existing = dodgeIcon.querySelector('.dodge-cd');
      if (!existing) { existing = document.createElement('div'); existing.className = 'dodge-cd'; dodgeIcon.appendChild(existing); }
      existing.textContent = p.dodgeCd.toFixed(1);
    } else {
      dodgeIcon.classList.add('ready');
      const existing = dodgeIcon.querySelector('.dodge-cd');
      if (existing) existing.remove();
    }

    document.getElementById('killLog').innerHTML = this.game.killLog.map(k =>
      `<div class="kill-item" style="opacity:${Math.min(1, k.time / 1.5)}">${k.text}</div>`
    ).join('');

    this.updatePickupHint();
    if (this.game.equipPanelOpen) this.updateEquipPanel();

    const lowHp = document.getElementById('lowHpWarning');
    if (p.hp / p.maxHpTotal < 0.25 && p.hp > 0) lowHp.classList.add('danger');
    else lowHp.classList.remove('danger');
  }

  setBar(id, cur, max) {
    const pct = max > 0 ? (cur / max * 100).toFixed(0) : 0;
    const bar = document.getElementById(id);
    bar.querySelector('.bar-fill').style.width = pct + '%';
    bar.querySelector('.bar-text').textContent = `${Math.ceil(cur)}/${max}`;
  }

  updatePickupHint() {
    const phEl = document.getElementById('pickupHint');
    const d = this.game.nearestDrop;
    if (d) {
      const eq = d.equip;
      phEl.style.display = 'block';
      document.getElementById('phName').innerHTML = `<span style="color:${eq.quality.color}">[${eq.quality.name}] ${eq.name}</span>`;
      document.getElementById('phStats').textContent = `${EQUIP_ICONS[eq.type]} ${eq.type} · ${equipStatText(eq)}`;
      const old = this.game.player.equip[eq.type];
      const compare = document.getElementById('phCompare');
      if (old) {
        const better = this.game.shouldEquip(eq, old);
        compare.textContent = better ? '✅ 优于当前装备' : '⚠️ 不如当前装备';
        compare.style.color = better ? '#4f4' : '#f44';
      } else {
        compare.textContent = '✅ 空槽位，可直接装备';
        compare.style.color = '#4f4';
      }
    } else {
      phEl.style.display = 'none';
    }
  }

  updateEquipPanel() {
    const grid = document.getElementById('equipGrid');
    const p = this.game.player;
    grid.innerHTML = EQUIP_TYPES.map(type => {
      const eq = p.equip[type];
      if (eq) {
        return `<div class="equip-slot">
          <span class="slot-icon">${EQUIP_ICONS[type]}</span>
          <div class="slot-info">
            <div class="slot-name" style="color:${eq.quality.color}">${eq.name}</div>
            <div class="slot-type">${type} · ${eq.quality.name}</div>
            <div class="slot-stats">${equipStatText(eq)}</div>
          </div>
        </div>`;
      }
      return `<div class="equip-slot">
        <span class="slot-icon" style="opacity:0.3">${EQUIP_ICONS[type]}</span>
        <div class="slot-info">
          <div class="slot-name" style="color:#555">未装备</div>
          <div class="slot-type">${type}</div>
        </div>
      </div>`;
    }).join('');
  }

  showLevelUp(rewards, onSelect) {
    const panel = document.getElementById('levelUpPanel');
    const list = document.getElementById('rewardList');
    list.innerHTML = '';
    rewards.forEach(r => {
      const card = document.createElement('div');
      card.className = 'reward-card';
      card.innerHTML = `<div class="reward-icon">${r.icon}</div><div class="reward-name">${r.name}</div><div class="reward-desc">${r.desc}</div>`;
      card.addEventListener('click', () => {
        panel.style.display = 'none';
        onSelect(r);
      });
      list.appendChild(card);
    });
    panel.style.display = 'block';
  }

  hideLevelUp() {
    document.getElementById('levelUpPanel').style.display = 'none';
  }
}
