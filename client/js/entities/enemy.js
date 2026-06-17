import { ENEMY_TYPES, ENEMY_AGGRO_RANGE, ENEMY_LOSE_AGGRO_RANGE, ENEMY_CHASE_SPEED_RATIO, ENEMY_WANDER_SPEED_RATIO } from '../config.js';
import { rand, randInt, vdist, vsub, vnorm, vec, pick } from '../utils.js';
import { getSpearmanSlice, getGeneralSlice, getGeneralAttackFrame, getGeneralWalkFrame, getSpearmanWalkFrame, getSpearmanAttackFrame, getLubuSlice, getLubuWalkFrame, getLubuAttackFrame, getLubuSkillFrame, getCavalrySlice, getCavalryWalkFrame, getCavalryAttackFrame, getArcherSlice, getArcherWalkFrame, getArcherAttackFrame, arrowImage } from '../assets.js';
import { Projectile } from './projectile.js';

export class Enemy {
  constructor(x, y, type, level, options = {}) {
    const t = ENEMY_TYPES[type];
    this.x = x; this.y = y; this.type = type; this.name = t.name;
    this.color = t.color; this.radius = t.radius; this.level = level;
    const scale = 1 + (level - 1) * 0.25;
    this.maxHp = Math.floor(t.hp * scale); this.hp = this.maxHp;
    this.atk = Math.floor(t.atk * scale); this.def = Math.floor(t.def * scale);
    this.speed = t.speed; this.exp = Math.floor(t.exp * scale);
    this.score = t.score; this.dropRate = t.dropRate;
    this.ranged = t.ranged || false; this.shootCd = t.shootCd || 0;
    this.shootTimer = rand(0.5, 2);
    this.dir = Math.random() * Math.PI * 2;
    this.state = 'idle';
    this.stateTimer = rand(0.5, 2);
    this.attackCd = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.animTimer = Math.random() * Math.PI * 2;
    this.walkAnimTimer = 0;
    this.attacking = false;
    this.attackAnimTimer = 0;
    this.arrowFired = false; // 弓箭手本次攻击是否已射出箭矢
    this.aggro = false; // 是否正在追踪赵云

    // Boss 特殊机制
    this.baseRadius = this.radius;
    this.baseMaxHp = this.maxHp;
    this.baseAtk = this.atk;
    this.baseDef = this.def;
    this.sizeScale = 1;
    this.hpRegen = type === 'boss' ? 0.05 : 0;
    this.hasRevived = options.skipRevive ? true : false;
    this.reviveTimer = 0;
    this.enraged = false;

    // 增强版曹操（最终阶段）
    this.enhanced = options.enhanced || false;
    if (this.enhanced && type === 'boss') {
      this.name = '曹操·狂暴';
      this.maxHp = Math.floor(this.maxHp * 1.8);
      this.hp = this.maxHp;
      this.baseMaxHp = this.maxHp;
      this.atk = Math.floor(this.atk * 1.4);
      this.def = Math.floor(this.def * 1.4);
      this.baseAtk = this.atk;
      this.baseDef = this.def;
      this.sizeScale = 1.4;
      this.radius = this.baseRadius * this.sizeScale;
      this.hpRegen = 0.08;
    }
  }

  takeDamage(dmg, isCrit, fromDir, game) {
    const actual = Math.max(1, dmg - this.def);
    this.hp -= actual;
    this.hitFlash = 0.15;
    const color = isCrit ? '#ffd700' : '#ff4444';
    const size = isCrit ? 24 : 17;
    game.addText(this.x, this.y - 28, (isCrit ? '暴击! ' : '') + actual, color, size, '#000');
    game.addParticles(this.x, this.y, '#ff4444', 6, 70);
    if (this.hp <= 0) {
      if (this.type === 'boss' && !this.hasRevived) {
        // 曹操首次死亡，进入 60 秒复活倒计时
        this.dead = true;
        this.deathTimer = 60;
        this.reviveTimer = 60;
        this.hasRevived = true;
        if (game.onBossFirstDeath) game.onBossFirstDeath(this);
      } else {
        this.dead = true;
        this.deathTimer = 0.6;
        game.onEnemyKilled(this);
      }
    }
  }

  reviveBoss() {
    this.dead = false;
    this.reviveTimer = 0;
    // 变强 1 倍：攻击、防御、生命翻倍
    this.maxHp = Math.floor(this.baseMaxHp * 2);
    this.hp = this.maxHp;
    this.atk = Math.floor(this.baseAtk * 2);
    this.def = Math.floor(this.baseDef * 2);
    this.baseMaxHp = this.maxHp;
    this.baseAtk = this.atk;
    this.baseDef = this.def;
    // 复活后保持狂暴体型（如果已触发）
    this.radius = this.baseRadius * this.sizeScale;
  }

  update(dt, game) {
    if (this.dead) {
      if (this.type === 'boss' && this.reviveTimer > 0) {
        this.reviveTimer -= dt;
        if (this.reviveTimer <= 0) {
          this.reviveBoss();
          if (game.onBossRevived) game.onBossRevived(this);
        }
        return;
      }
      this.deathTimer -= dt;
      return;
    }
    if (this.attacking) {
      this.attackAnimTimer -= dt;
      if (this.attackAnimTimer <= 0) this.attacking = false;
    }
    this.hitFlash -= dt;
    this.attackCd -= dt;
    this.stateTimer -= dt;
    this.animTimer += dt * 3;

    // Boss 自动回血
    if (this.type === 'boss' && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * this.hpRegen * dt);
    }

    // Boss 半血狂暴：体型增大 50%
    if (this.type === 'boss' && !this.enraged && this.hp <= this.maxHp * 0.5) {
      this.enraged = true;
      this.sizeScale = 1.5;
      this.radius = this.baseRadius * this.sizeScale;
      if (game.addText) game.addText(this.x, this.y - this.radius - 30, '曹操狂暴！体型暴增', '#ff44ff', 22, '#000');
      if (game.shakeScreen) game.shakeScreen(6);
      if (game.addParticles) game.addParticles(this.x, this.y, '#ff44ff', 30, 140);
    }

    const isMoving = this.state === 'chase' || this.state === 'wander';
    if (isMoving) {
      this.walkAnimTimer += dt * 10;
    } else {
      this.walkAnimTimer = 0;
    }

    const p = game.player;
    const dist = vdist(vec(this.x, this.y), vec(p.x, p.y));

    // 追踪判定：进入范围开始追，超出更远的范围才放弃（带滞后，避免来回切换）
    if (!this.aggro && dist < ENEMY_AGGRO_RANGE) this.aggro = true;
    if (this.aggro && dist > ENEMY_LOSE_AGGRO_RANGE) this.aggro = false;

    if (this.aggro) {
      this.state = 'chase';
      const dir = vnorm(vsub(vec(p.x, p.y), vec(this.x, this.y)));
      this.dir = Math.atan2(dir.y, dir.x);
      // 追击速度比正常慢，所有敌人（含Boss）统一使用倍率
      const chaseSpeed = this.speed * ENEMY_CHASE_SPEED_RATIO;
      if (this.ranged) {
        if (this.attacking) {
          // 射箭时站定并持续面向赵云
          this.dir = Math.atan2(p.y - this.y, p.x - this.x);
          // 在动画中段（拉满弓时）射出箭矢
          if (!this.arrowFired && this.attackAnimTimer <= 0.25) {
            this.arrowFired = true;
            const a = this.dir + rand(-0.15, 0.15);
            game.projectiles.push(new Projectile(this.x, this.y, a, 260, this.atk, 'enemy', '#ffaa00', 6, 2.5, arrowImage));
          }
        } else {
          // 攻击前始终面向赵云
          this.dir = Math.atan2(p.y - this.y, p.x - this.x);
          if (dist < 150) { this.x -= dir.x * chaseSpeed * dt; this.y -= dir.y * chaseSpeed * dt; }
          this.shootTimer -= dt;
          if (this.shootTimer <= 0) {
            this.shootTimer = this.shootCd;
            this.attacking = true;
            this.attackAnimTimer = 0.5;
            this.arrowFired = false;
            this.dir = Math.atan2(p.y - this.y, p.x - this.x);
          }
        }
      } else {
        if (dist > this.radius + p.radius + 10) {
          this.x += dir.x * chaseSpeed * dt;
          this.y += dir.y * chaseSpeed * dt;
        } else if (this.attackCd <= 0) {
          // 曹将和枪兵靠近赵云自动攻击，频率 1 秒 1 次
          this.attackCd = 1.0;
          this.attacking = true;
          this.attackAnimTimer = 0.5;
          p.takeDamage(this.atk, game);
          game.addParticles(p.x, p.y, '#ff6600', 6, 55);
        }
      }
    } else {
      if (this.stateTimer <= 0) {
        this.stateTimer = rand(1, 3);
        this.dir = Math.random() * Math.PI * 2;
        this.state = Math.random() > 0.3 ? 'wander' : 'idle';
      }
      if (this.state === 'wander') {
        this.x += Math.cos(this.dir) * this.speed * ENEMY_WANDER_SPEED_RATIO * dt;
        this.y += Math.sin(this.dir) * this.speed * ENEMY_WANDER_SPEED_RATIO * dt;
      }
    }
    this.x = Math.max(this.radius, Math.min(3000 - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(2000 - this.radius, this.y));
  }

  draw(ctx, cam) {
    const sx = this.x - cam.x, sy = this.y - cam.y;
    if (this.dead) ctx.globalAlpha = this.deathTimer / 0.6;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius + 3, (this.radius + 1) * this.sizeScale, 5 * this.sizeScale, 0, 0, Math.PI * 2);
    ctx.fill();

    const isMoving = this.state === 'chase' || this.state === 'wander';
    const spriteMap = {
      soldier: { sliceGetter: getSpearmanSlice, walkGetter: getSpearmanWalkFrame, attackGetter: getSpearmanAttackFrame, drawH: 160, walkScale: 1.10, attackScale: 1.05 },
      archer: { sliceGetter: getArcherSlice, walkGetter: getArcherWalkFrame, attackGetter: getArcherAttackFrame, drawH: 160, walkScale: 1.10, attackScale: 1.05 },
      cavalry: { sliceGetter: getCavalrySlice, walkGetter: getCavalryWalkFrame, attackGetter: getCavalryAttackFrame, drawH: 180, walkScale: 1.48, attackScale: 1.24 },
      general: { sliceGetter: getGeneralSlice, walkGetter: getGeneralWalkFrame, attackGetter: getGeneralAttackFrame, drawH: 220, walkScale: 1.26, attackScale: 1.22 },
      boss: { sliceGetter: getGeneralSlice, walkGetter: getGeneralWalkFrame, attackGetter: getGeneralAttackFrame, drawH: 300, walkScale: 1.26, attackScale: 1.22 },
      lubu: { sliceGetter: getLubuSlice, walkGetter: getLubuWalkFrame, attackGetter: getLubuAttackFrame, skillGetter: getLubuSkillFrame, drawH: 360, walkScale: 1.13, attackScale: 1.40 }
    };
    const sprite = spriteMap[this.type];
    let spriteTopY = sy - this.radius - 8;
    if (sprite) {
      let img = null;
      let scale = 1.0;
      let drawH = sprite.drawH * this.sizeScale;
      let flipX = false;
      const a = this.dir;
      if (this.type === 'lubu' || this.type === 'cavalry' || this.type === 'archer') {
        // 吕布/骑兵/弓箭手只有向左移动动画，向右时水平翻转
        flipX = a >= -Math.PI / 2 && a <= Math.PI / 2;
      } else {
        flipX = a > Math.PI / 2 || a < -Math.PI / 2;
      }
      if (this.attacking) {
        const progress = Math.max(0, Math.min(1, 1 - this.attackAnimTimer / 0.5));
        const frameIndex = Math.min(5, Math.floor(progress * 6));
        img = sprite.attackGetter(frameIndex);
        scale = sprite.attackScale || 1.0;
        if (this.type === 'archer') {
          // 弓箭手攻击帧本身是朝右拉弓，向左射击时才需要翻转
          flipX = a > Math.PI / 2 || a < -Math.PI / 2;
        }
      } else if (isMoving) {
        const frameIndex = Math.floor(this.walkAnimTimer) % 6;
        img = (this.type === 'lubu' || this.type === 'cavalry') ? sprite.walkGetter(frameIndex) : sprite.walkGetter(this.dir, frameIndex);
        scale = sprite.walkScale || 1.0;
      }
      if (!img || !img.complete || img.naturalWidth <= 0) {
        img = sprite.sliceGetter(this.dir);
        scale = 1.0;
      }
      drawH *= scale;
      if (img && img.complete && img.naturalWidth > 0) {
        spriteTopY = sy - drawH * 0.78 - 6;
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
        this.drawFallback(ctx, sx, sy);
      }
    } else {
      this.drawFallback(ctx, sx, sy);
    }

    if (this.hp < this.maxHp && !this.dead) {
      const bw = this.radius * 2.2;
      const bx = sx - bw / 2, by = sy - this.radius - 14;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
      ctx.fillStyle = this.type === 'boss' ? '#ee44ee' : '#dd2220';
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 4);
      ctx.fillStyle = '#fff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.hp}/${this.maxHp}`, sx, by - 2);
    }

    if (!this.dead) {
      ctx.fillStyle = this.type === 'lubu' ? '#ff0000' : this.type === 'boss' ? (this.enhanced ? '#ff0000' : '#ff44ff') : this.type === 'general' ? '#ff8844' : this.type === 'cavalry' ? '#aaaaaa' : '#bbb';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.font = (this.type === 'boss' || this.type === 'lubu' ? 'bold 13px' : '11px') + ' "Microsoft YaHei"';
      ctx.textAlign = 'center';
      const hasHpBar = this.hp < this.maxHp;
      const nameText = this.type === 'boss' || this.type === 'lubu' ? this.name : `${this.name} Lv.${this.level}`;
      const nameY = hasHpBar ? spriteTopY - 10 : spriteTopY - 4;
      ctx.strokeText(nameText, sx, nameY);
      ctx.fillText(nameText, sx, nameY);
    }

    ctx.globalAlpha = 1;
  }

  drawFallback(ctx, sx, sy) {
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    if (!this.dead) {
      const innerColor = this.type === 'boss' ? '#6a0dad' : this.type === 'general' ? '#aa0000' : '#2a2a2a';
      ctx.fillStyle = this.hitFlash > 0 ? '#fff' : innerColor;
      ctx.beginPath();
      ctx.arc(sx + Math.cos(this.dir) * 4, sy + Math.sin(this.dir) * 4, this.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      if (this.ranged) {
        ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : '#8B7355';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(this.dir) * this.radius, sy + Math.sin(this.dir) * this.radius);
        ctx.lineTo(sx + Math.cos(this.dir) * (this.radius + 12), sy + Math.sin(this.dir) * (this.radius + 12));
        ctx.stroke();
      }

      ctx.fillStyle = '#ff2200';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 4;
      const ex = sx + Math.cos(this.dir) * this.radius * 0.5;
      const ey = sy + Math.sin(this.dir) * this.radius * 0.5;
      ctx.beginPath();
      ctx.arc(ex - Math.sin(this.dir) * 3, ey + Math.cos(this.dir) * 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + Math.sin(this.dir) * 3, ey - Math.cos(this.dir) * 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
