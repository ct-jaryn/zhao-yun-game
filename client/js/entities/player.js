import { MAP_W, MAP_H, SKILLS, EQUIP_TYPES, EQUIP_NAMES, EQUIP_ICONS, QUALITY, REWARD_TYPES } from '../config.js';
import { rand, vdist, vnorm, vec, pick, clamp, angleDiff } from '../utils.js';
import { getPlayerSlice, getPlayerSkillFrame, getPlayerDodgeFrame, getPlayerHurtFrame, getPlayerDeathFrame, getPlayerWalkFrame, getPlayerUltimateFrame } from '../assets.js';
import { Projectile } from './projectile.js';

export function genEquip(level) {
  const type = pick(EQUIP_TYPES);
  const name = pick(EQUIP_NAMES[type]);
  const qRoll = Math.random();
  let qi = 0;
  if (qRoll < 0.02) qi = 4;
  else if (qRoll < 0.08) qi = 3;
  else if (qRoll < 0.25) qi = 2;
  else if (qRoll < 0.55) qi = 1;
  const q = QUALITY[qi];
  const base = level * 2 + 5;
  const stats = {};
  if (type === '武器') {
    stats.atk = Math.floor(base * q.mult * rand(0.8, 1.2));
    if (qi >= 2) stats.crit = Math.floor(rand(3, 8) * q.mult);
  } else if (type === '铠甲') {
    stats.def = Math.floor(base * q.mult * rand(0.8, 1.2));
    stats.hp = Math.floor(base * 3 * q.mult * rand(0.8, 1.2));
  } else if (type === '头盔') {
    stats.def = Math.floor(base * 0.5 * q.mult * rand(0.8, 1.2));
    stats.hp = Math.floor(base * 2 * q.mult * rand(0.8, 1.2));
  } else if (type === '靴子') {
    stats.spd = Math.floor(rand(1, 3) * q.mult);
    stats.def = Math.floor(base * 0.3 * q.mult);
  } else {
    stats.hp = Math.floor(base * 2 * q.mult * rand(0.8, 1.2));
    stats.mp = Math.floor(base * q.mult * rand(0.8, 1.2));
  }
  return { type, name, quality: q, stats, level };
}

export function equipStatText(eq) {
  const labels = { atk:'攻击', def:'防御', hp:'生命', mp:'法力', crit:'暴击', spd:'速度' };
  return Object.entries(eq.stats).map(([k, v]) => `${labels[k] || k}+${v}`).join(' ');
}

export function equipPower(eq) {
  let v = 0;
  for (const k in eq.stats) v += eq.stats[k];
  return v * eq.quality.mult;
}

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.dir = 0;
    this.speed = 200; this.radius = 36;
    this.level = 1; this.exp = 0; this.expToLevel = 100;
    this.maxHp = 150; this.hp = 150;
    this.maxMp = 80; this.mp = 80;
    this.baseAtk = 20; this.baseDef = 8; this.critRate = 5; this.mpRegen = 3;
    this.equip = { '武器': null, '铠甲': null, '头盔': null, '靴子': null, '饰品': null };
    this.skillCd = [0, 0, 0, 0, 0];
    this.attacking = false; this.attackTimer = 0; this.attackAnim = 0; this.currentSkill = 0;
    this.dodging = false; this.dodgeTimer = 0; this.dodgeDir = 0; this.dodgeCd = 0;
    this.invulnTimer = 0; this.flashTimer = 0; this.hurtAnimTimer = 0;
    this.dead = false; this.deathAnimTimer = 0;
    this.combo = 0; this.comboTimer = 0; this.maxCombo = 0;
    this.hitCooldowns = new Map();

    // Bonus multipliers from level-up rewards
    this.bonusAtk = 0;
    this.bonusCrit = 0;
    this.bonusSpd = 0;
    this.bonusCdr = 0;
    this.bonusHp = 0;
    this.bonusMpRegen = 0;

    this.mouseAim = false;
    this.targetDir = 0;
    this.moving = false;
    this.walkAnimTimer = 0;
  }

  get atk() {
    let v = this.baseAtk + this.level * 3;
    if (this.equip['武器']) v += this.equip['武器'].stats.atk || 0;
    return Math.floor(v * (1 + this.bonusAtk));
  }
  get def() {
    let v = this.baseDef + this.level;
    for (const k of ['铠甲', '头盔']) if (this.equip[k]) v += this.equip[k].stats.def || 0;
    return v;
  }
  get crit() {
    let v = this.critRate + this.bonusCrit;
    if (this.equip['武器']) v += this.equip['武器'].stats.crit || 0;
    return v;
  }
  get maxHpTotal() {
    let v = (this.maxHp + (this.level - 1) * 15) * (1 + this.bonusHp);
    for (const k of ['铠甲', '头盔', '饰品']) if (this.equip[k]) v += this.equip[k].stats.hp || 0;
    return Math.floor(v);
  }
  get maxMpTotal() {
    let v = this.maxMp + (this.level - 1) * 5;
    if (this.equip['饰品']) v += this.equip['饰品'].stats.mp || 0;
    return v;
  }
  get speedTotal() {
    let v = this.speed * (1 + this.bonusSpd);
    if (this.equip['靴子']) v += this.equip['靴子'].stats.spd * 15;
    return v;
  }

  addExp(v, game) {
    this.exp += v;
    while (this.exp >= this.expToLevel) {
      this.exp -= this.expToLevel;
      this.level++;
      this.expToLevel = Math.floor(this.expToLevel * 1.4);
      this.hp = this.maxHpTotal;
      this.mp = this.maxMpTotal;
      this.baseAtk += 3;
      this.baseDef += 2;
      game.addText(this.x, this.y - 50, `升级! Lv.${this.level}`, '#ffd700', 26, '#000');
      game.addParticles(this.x, this.y, '#ffd700', 25, 120);
      game.shakeScreen(4);
      game.flashScreen('rgba(255,215,0,1)', 0.2);
      game.showLevelUp();
    }
  }

  update(dt, keys, mouse, game) {
    if (this.dead) {
      if (this.deathAnimTimer > 0) this.deathAnimTimer -= dt;
      return;
    }

    this.mp = Math.min(this.maxMpTotal, this.mp + this.mpRegen * (1 + this.bonusMpRegen) * dt);
    for (let i = 0; i < 5; i++) if (this.skillCd[i] > 0) this.skillCd[i] -= dt;
    if (this.dodgeCd > 0) this.dodgeCd -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.hurtAnimTimer > 0) this.hurtAnimTimer -= dt;
    if (this.deathAnimTimer > 0) this.deathAnimTimer -= dt;

    for (const [key, val] of this.hitCooldowns) {
      this.hitCooldowns.set(key, val - dt);
      if (val - dt <= 0) this.hitCooldowns.delete(key);
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        if (this.combo >= 5) game.addText(this.x, this.y - 70, '连击中断!', '#888', 16, '#000');
        this.combo = 0;
      }
    }

    const aim = this.mouseAim && mouse.down ? Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x) : null;

    if (this.dodging) {
      this.dodgeTimer -= dt;
      this.x += Math.cos(this.dodgeDir) * 400 * dt;
      this.y += Math.sin(this.dodgeDir) * 400 * dt;
      if (this.dodgeTimer <= 0) this.dodging = false;
      this.clampPos();
      return;
    }
    if (this.attacking) {
      this.attackTimer -= dt;
      this.attackAnim += dt * 8;
      if (this.attackTimer <= 0) { this.attacking = false; this.attackAnim = 0; }
      return;
    }

    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
    if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) dy += 1;

    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      this.walkAnimTimer += dt * 10;
    } else {
      this.walkAnimTimer = 0;
    }
    if (dx || dy) {
      const d = vnorm(vec(dx, dy));
      this.x += d.x * this.speedTotal * dt;
      this.y += d.y * this.speedTotal * dt;
      if (!this.mouseAim) this.dir = Math.atan2(d.y, d.x);
      this.moveTarget = null;
      if (Math.random() < dt * 8) {
        game.addParticles(this.x + rand(-5, 5), this.y + this.radius, 'rgba(100,80,50,0.6)', 1, 20, 2);
      }
    }

    if (aim !== null) {
      this.dir = aim;
      this.mouseAim = true;
    }

    this.clampPos();
  }

  clampPos() {
    this.x = Math.max(this.radius, Math.min(MAP_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(MAP_H - this.radius, this.y));
  }

  useSkill(idx, game) {
    if (this.attacking || this.dodging) return;
    const sk = SKILLS[idx];
    const cd = sk.cd * (1 - this.bonusCdr);
    if (this.skillCd[idx] > 0) return;
    if (this.mp < sk.mp) {
      game.addText(this.x, this.y - 30, '法力不足!', '#4488ff', 14, '#000');
      return;
    }
    this.mp -= sk.mp;
    this.skillCd[idx] = cd;
    this.attacking = true;
    this.attackTimer = 0.25 + idx * 0.08;
    this.currentSkill = idx;

    if (idx === 2) {
      this.x += Math.cos(this.dir) * 90;
      this.y += Math.sin(this.dir) * 90;
      this.clampPos();
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        game.addParticles(
          this.x - Math.cos(this.dir) * 90 * t,
          this.y - Math.sin(this.dir) * 90 * t,
          '#ff8844', 1, 40, 4
        );
      }
    }

    const hits = [];
    for (const e of game.enemies) {
      if (e.dead) continue;
      const dist = vdist(vec(this.x, this.y), vec(e.x, e.y));
      if (dist > sk.range + e.radius) continue;
      const angleTo = Math.atan2(e.y - this.y, e.x - this.x);
      if (Math.abs(angleDiff(angleTo, this.dir)) <= sk.arc / 2) hits.push(e);
    }

    if (idx === 4) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        game.projectiles.push(new Projectile(this.x, this.y, a, 350, this.atk * 0.5, 'player', '#ffd700', 5, 1.5));
      }
      game.addParticles(this.x, this.y, '#ffd700', 35, 160);
      game.shakeScreen(8);
      game.flashScreen('rgba(255,215,0,1)', 0.25);
    }

    if (idx === 3) {
      for (let i = 0; i < 50; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * sk.range;
        game.addParticles(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, pick(['#ff4400','#ff8800','#ffcc00']), 1, 80, 5);
      }
      game.shakeScreen(5);
      game.flashScreen('rgba(255,100,0,1)', 0.2);
    }

    if (idx === 1) {
      game.addParticles(this.x, this.y, '#88ccff', 18, 90);
      game.shakeScreen(3);
    }

    for (const e of hits) this.hitEnemy(e, sk.dmgMult, idx, game);
  }

  hitEnemy(e, mult, skillIdx, game) {
    const hk = `${skillIdx}_${e.id || `${e.x.toFixed(0)}_${e.y.toFixed(0)}`}`;
    if (this.hitCooldowns.has(hk)) return;
    this.hitCooldowns.set(hk, 0.1);

    let dmg = Math.floor(this.atk * mult);
    let isCrit = Math.random() * 100 < this.crit;
    if (isCrit) dmg = Math.floor(dmg * 1.8);
    dmg = Math.max(1, dmg - e.def);
    e.takeDamage(dmg, isCrit, this.dir, game);
    this.combo++;
    this.comboTimer = 3;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
  }

  dodge(game) {
    if (this.dodging || this.dodgeCd > 0) return;
    this.dodging = true; this.dodgeTimer = 0.25; this.dodgeCd = 0.8;
    this.dodgeDir = this.dir; this.invulnTimer = 0.3;
    game.addParticles(this.x, this.y, '#aaccff', 10, 70);
  }

  takeDamage(dmg, game) {
    if (this.invulnTimer > 0) return;
    const actual = Math.max(1, dmg - this.def);
    this.hp -= actual;
    this.flashTimer = 0.3;
    this.invulnTimer = 0.5;
    this.hurtAnimTimer = 0.4;
    game.addText(this.x, this.y - 30, `-${actual}`, '#ff2222', 20, '#000');
    game.addParticles(this.x, this.y, '#ff0000', 10, 90);
    game.shakeScreen(6);
    game.flashScreen('rgba(255,0,0,1)', 0.15);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deathAnimTimer = 1.0;
    }
  }

  draw(ctx, cam) {
    const sx = this.x - cam.x, sy = this.y - cam.y;
    if (this.flashTimer > 0 && !this.dead && Math.floor(this.flashTimer * 20) % 2) return;

    // Death animation (highest priority)
    if (this.dead) {
      const progress = Math.max(0, Math.min(1, 1 - this.deathAnimTimer / 1.0));
      const frameIndex = Math.min(3, Math.floor(progress * 4));
      const deathImg = getPlayerDeathFrame(frameIndex);
      if (deathImg && deathImg.complete && deathImg.naturalWidth > 0) {
        const drawH = 192;
        const drawW = drawH * (deathImg.naturalWidth / deathImg.naturalHeight);
        const a = this.dir;
        const flipX = a > Math.PI / 2 || a < -Math.PI / 2;
        if (flipX) {
          ctx.save();
          ctx.translate(sx, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(deathImg, -drawW / 2, sy - drawH * 0.78, drawW, drawH);
          ctx.restore();
        } else {
          ctx.drawImage(deathImg, sx - drawW / 2, sy - drawH * 0.78, drawW, drawH);
        }
      }
      return;
    }

    if (this.dodging) {
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.15 / i;
        ctx.fillStyle = '#88aaff';
        ctx.beginPath();
        ctx.arc(sx - Math.cos(this.dodgeDir) * 15 * i, sy - Math.sin(this.dodgeDir) * 15 * i, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius + 8, this.radius + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    let img;
    let flipX = false;
    const idle = !this.moving && !this.dodging && !this.attacking && this.hurtAnimTimer <= 0;
    const canWalk = this.moving && !this.dodging && !this.attacking && this.hurtAnimTimer <= 0;
    if (idle) {
      img = getPlayerSlice(Math.PI / 2);
    } else if (canWalk) {
      const frameIndex = Math.floor(this.walkAnimTimer) % 6;
      img = getPlayerWalkFrame(frameIndex);
      const a = this.dir;
      // Source animation faces left; flip when moving right
      flipX = a >= -Math.PI / 2 && a <= Math.PI / 2;
    } else {
      img = getPlayerSlice(this.dir);
    }

    // Use dodge animation during roll
    if (this.dodging) {
      const progress = Math.max(0, Math.min(1, 1 - this.dodgeTimer / 0.25));
      const frameIndex = Math.min(3, Math.floor(progress * 4));
      const dodgeImg = getPlayerDodgeFrame(frameIndex);
      if (dodgeImg && dodgeImg.complete && dodgeImg.naturalWidth > 0) {
        img = dodgeImg;
        const a = this.dodgeDir;
        if (a > Math.PI / 2 || a < -Math.PI / 2) flipX = true;
      }
    }

    // Use skill animation if available (skill 0 普攻, skill 1 旋风斩, skill 4 大招)
    if (this.attacking && [0, 1, 4].includes(this.currentSkill)) {
      const totalAttackTime = 0.25 + this.currentSkill * 0.08;
      const progress = Math.max(0, Math.min(1, 1 - this.attackTimer / totalAttackTime));
      let animImg = null;
      if (this.currentSkill === 4) {
        const frameCount = 6;
        const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
        animImg = getPlayerUltimateFrame(frameIndex);
      } else {
        const frameCount = 4;
        const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
        animImg = getPlayerSkillFrame(this.currentSkill, frameIndex);
      }
      if (animImg && animImg.complete && animImg.naturalWidth > 0) {
        img = animImg;
        // Source animations face right; flip when facing roughly left
        const a = this.dir;
        if (a > Math.PI / 2 || a < -Math.PI / 2) flipX = true;
      }
    }

    // Use hurt animation when taking damage
    if (this.hurtAnimTimer > 0 && !this.dodging && !this.attacking) {
      const progress = Math.max(0, Math.min(1, 1 - this.hurtAnimTimer / 0.4));
      const frameIndex = Math.min(3, Math.floor(progress * 4));
      const hurtImg = getPlayerHurtFrame(frameIndex);
      if (hurtImg && hurtImg.complete && hurtImg.naturalWidth > 0) {
        img = hurtImg;
        const a = this.dir;
        if (a > Math.PI / 2 || a < -Math.PI / 2) flipX = true;
      }
    }

    if (img && img.complete && img.naturalWidth > 0) {
      const drawH = 192;
      const drawW = drawH * (img.naturalWidth / img.naturalHeight);
      if (flipX) {
        ctx.save();
        ctx.translate(sx, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -drawW / 2, sy - drawH * 0.78, drawW, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(img, sx - drawW / 2, sy - drawH * 0.78, drawW, drawH);
      }
    } else {
      // Fallback circle avatar
      ctx.fillStyle = '#cc2222';
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Attack skill arc effect
    if (this.attacking) {
      ctx.save();
      ctx.translate(sx, sy);
      const sk = SKILLS[this.currentSkill];
      if (sk.range > 70) {
        const colors = ['#88ccff','#88ccff','#ff8844','#ff4400','#ffd700'];
        ctx.strokeStyle = colors[this.currentSkill];
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6 * (this.attackTimer / (0.25 + this.currentSkill * 0.08));
        ctx.beginPath();
        ctx.arc(0, 0, sk.range, this.dir - sk.arc / 2, this.dir + sk.arc / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText(`Lv.${this.level}`, sx, sy - 88);
    ctx.fillText(`Lv.${this.level}`, sx, sy - 88);
  }
}
