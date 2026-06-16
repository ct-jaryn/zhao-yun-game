import { ENEMY_TYPES } from '../config.js';
import { rand, randInt, vdist, vsub, vnorm, vec, pick } from '../utils.js';
import { getSpearmanSlice, getGeneralSlice, getGeneralAttackFrame, getGeneralWalkFrame, getSpearmanWalkFrame, getSpearmanAttackFrame } from '../assets.js';
import { Projectile } from './projectile.js';

export class Enemy {
  constructor(x, y, type, level) {
    const t = ENEMY_TYPES[type];
    this.x = x; this.y = y; this.type = type; this.name = t.name;
    this.color = t.color; this.radius = t.radius; this.level = level;
    const scale = 1 + (level - 1) * 0.15;
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
      this.dead = true;
      this.deathTimer = 0.6;
      game.onEnemyKilled(this);
    }
  }

  update(dt, game) {
    if (this.dead) { this.deathTimer -= dt; return; }
    if (this.attacking) {
      this.attackAnimTimer -= dt;
      if (this.attackAnimTimer <= 0) this.attacking = false;
    }
    this.hitFlash -= dt;
    this.attackCd -= dt;
    this.stateTimer -= dt;
    this.animTimer += dt * 3;
    const isMoving = this.state === 'chase' || this.state === 'wander';
    if (isMoving) {
      this.walkAnimTimer += dt * 10;
    } else {
      this.walkAnimTimer = 0;
    }

    const p = game.player;
    const dist = vdist(vec(this.x, this.y), vec(p.x, p.y));
    const aggroRange = this.ranged ? 350 : 250;

    if (dist < aggroRange) {
      this.state = 'chase';
      const dir = vnorm(vsub(vec(p.x, p.y), vec(this.x, this.y)));
      this.dir = Math.atan2(dir.y, dir.x);
      if (this.ranged) {
        if (dist < 150) { this.x -= dir.x * this.speed * dt; this.y -= dir.y * this.speed * dt; }
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
          this.shootTimer = this.shootCd;
          const a = Math.atan2(p.y - this.y, p.x - this.x) + rand(-0.15, 0.15);
          game.projectiles.push(new Projectile(this.x, this.y, a, 260, this.atk, 'enemy', '#ffaa00', 4, 2.5));
        }
      } else {
        if (dist > this.radius + p.radius + 10) {
          this.x += dir.x * this.speed * dt;
          this.y += dir.y * this.speed * dt;
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
        this.x += Math.cos(this.dir) * this.speed * 0.4 * dt;
        this.y += Math.sin(this.dir) * this.speed * 0.4 * dt;
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
    ctx.ellipse(sx, sy + this.radius + 3, this.radius + 1, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const isMoving = this.state === 'chase' || this.state === 'wander';
    const spriteMap = {
      soldier: { sliceGetter: getSpearmanSlice, walkGetter: getSpearmanWalkFrame, attackGetter: getSpearmanAttackFrame, drawH: 160 },
      general: { sliceGetter: getGeneralSlice, walkGetter: getGeneralWalkFrame, attackGetter: getGeneralAttackFrame, drawH: 220 },
      boss: { sliceGetter: getGeneralSlice, walkGetter: getGeneralWalkFrame, attackGetter: getGeneralAttackFrame, drawH: 300 }
    };
    const sprite = spriteMap[this.type];
    let spriteTopY = sy - this.radius - 8;
    if (sprite) {
      let img = null;
      let drawH = sprite.drawH;
      const a = this.dir;
      const flipX = a > Math.PI / 2 || a < -Math.PI / 2;
      if (this.attacking) {
        const progress = Math.max(0, Math.min(1, 1 - this.attackAnimTimer / 0.5));
        const frameIndex = Math.min(5, Math.floor(progress * 6));
        img = sprite.attackGetter(frameIndex);
        drawH = sprite.drawH + 10;
      } else if (isMoving) {
        const frameIndex = Math.floor(this.walkAnimTimer) % 6;
        img = sprite.walkGetter(this.dir, frameIndex);
      }
      if (!img || !img.complete || img.naturalWidth <= 0) {
        img = sprite.sliceGetter(this.dir);
      }
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
      ctx.fillStyle = this.type === 'boss' ? '#ff44ff' : this.type === 'general' ? '#ff8844' : '#bbb';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.font = (this.type === 'boss' ? 'bold 13px' : '11px') + ' "Microsoft YaHei"';
      ctx.textAlign = 'center';
      const hasHpBar = this.hp < this.maxHp;
      const nameY = hasHpBar ? spriteTopY - 10 : spriteTopY - 4;
      ctx.strokeText(this.name, sx, nameY);
      ctx.fillText(this.name, sx, nameY);
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
