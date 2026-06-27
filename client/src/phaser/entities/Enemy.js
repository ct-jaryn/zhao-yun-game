import { MAP_W, MAP_H, ENEMY_TYPES, ENEMY_AGGRO_RANGE, ENEMY_LOSE_AGGRO_RANGE, ENEMY_CHASE_SPEED_RATIO, ENEMY_WANDER_SPEED_RATIO } from '../../config/index.js';
import { rand, randInt, vdist, vsub, vnorm, vec } from '../utils/index.js';
import { AssetLoader } from '../plugins/AssetLoader.js';
import { Projectile } from './Projectile.js';

const SPRITE_CONFIG = {
  soldier: { drawH: 160, type: 'spearman' },
  archer: { drawH: 160, type: 'archer' },
  cavalry: { drawH: 180, type: 'cavalry' },
  general: { drawH: 220, type: 'general' },
  boss: { drawH: 420, type: 'general' },
  lubu: { drawH: 450, type: 'lubu' },
  dianwei: { drawH: 440, type: 'dianwei' },
  xuzhu: { drawH: 440, type: 'xuzhu' }
};

export class Enemy {
  constructor(scene, x, y, type, level, options = {}) {
    const t = ENEMY_TYPES[type];
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.name = options.name || t.name;
    this.color = t.color;
    this.radius = t.radius;
    this.level = level;

    const scale = 1 + (level - 1) * 0.25;
    this.maxHp = Math.floor(t.hp * scale);
    this.hp = this.maxHp;
    this.atk = Math.floor(t.atk * scale);
    this.def = Math.floor(t.def * scale);
    this.speed = t.speed;
    this.exp = Math.floor(t.exp * scale);
    this.score = t.score;
    this.dropRate = t.dropRate;
    this.ranged = t.ranged || false;
    this.shootCd = t.shootCd || 0;
    this.shootTimer = rand(0.5, 2);

    this.dir = Math.random() * Math.PI * 2;
    this.state = 'idle';
    this.stateTimer = rand(0.5, 2);
    this.attackCd = 0;
    this.hitFlash = 0;
    this.hitKnockbackTimer = 0;
    this.hitKnockbackDir = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.attacking = false;
    this.attackAnimTimer = 0;
    this.isSkill = false;
    this.isUltimate = false;
    this.arrowFired = false;
    this.aggro = false;

    this.baseRadius = this.radius;
    this.baseMaxHp = this.maxHp;
    this.baseAtk = this.atk;
    this.baseDef = this.def;
    this.sizeScale = 1;
    this.hpRegen = (type === 'boss' || type === 'lubu') ? 0.05 : 0;
    this.hasRevived = options.skipRevive ? true : false;
    this.reviveTimer = 0;
    this.enraged = false;
    this.enhanced = options.enhanced || false;
    this.charmed = false;
    this.charmTimer = 0;

    if (this.enhanced && type === 'boss') {
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

    this.spriteConfig = SPRITE_CONFIG[type] || SPRITE_CONFIG.soldier;
    this.baseSpriteScale = null;
    this.createSprite();
    this.createHpBar();
    this.createNameLabel();
  }

  getBaseSpriteScale() {
    if (this.baseSpriteScale != null) return this.baseSpriteScale;
    if (this.sprite && this.sprite.texture) {
      const source = this.sprite.texture.getSourceImage();
      if (source && source.height > 0) {
        this.baseSpriteScale = this.spriteConfig.drawH / source.height;
        return this.baseSpriteScale;
      }
    }
    return 0.5;
  }

  getHpBarColor() {
    if (this.type === 'boss' || this.type === 'lubu') return 0xff00ff;
    if (['general', 'dianwei', 'xuzhu'].includes(this.type)) return 0xff4444;
    return 0x88ff88;
  }

  createSprite() {
    const key = AssetLoader.getEnemySliceKey(this.spriteConfig.type, this.dir);
    if (AssetLoader.hasTexture(this.scene, key)) {
      this.sprite = this.scene.add.sprite(this.x, this.y, key);
      const s = this.sizeScale;
      this.sprite.setScale(this.getBaseSpriteScale() * s);
    } else {
      this.sprite = this.scene.add.sprite(this.x, this.y, '__WHITE');
      this.sprite.setDisplaySize(this.radius * 2, this.radius * 2);
      this.sprite.setTint(parseInt(this.color.replace('#', '0x'), 16) || 0x556b2f);
    }
    this.sprite.setDepth(5);
  }

  createHpBar() {
    const barW = 60 * this.sizeScale;
    const barH = 6 * this.sizeScale;
    const yOffset = -this.radius * this.sizeScale - 15;

    this.hpBarBg = this.scene.add.rectangle(this.x, this.y + yOffset, barW, barH, 0x000000);
    this.hpBarBg.setDepth(15);

    this.hpBarFill = this.scene.add.rectangle(this.x - barW / 2, this.y + yOffset, barW, barH, this.getHpBarColor());
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(16);
  }

  createNameLabel() {
    const yOffset = -this.radius * this.sizeScale - 28;
    this.nameLabel = this.scene.add.text(this.x, this.y + yOffset, `Lv.${this.level} ${this.name}`, {
      fontFamily: 'Noto Serif SC',
      fontSize: `${12 * this.sizeScale}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(17);
  }

  updateHpBar() {
    if (!this.hpBarFill || !this.hpBarBg) return;
    const ratio = Math.max(0, this.hp / this.maxHp);
    const barW = 60 * this.sizeScale;
    this.hpBarFill.width = barW * ratio;
  }

  applyCharm(duration) {
    this.charmed = true;
    this.charmTimer = duration;
    if (this.sprite) this.sprite.setTint(0xff69b4);
  }

  _restoreTint() {
    if (!this.sprite) return;
    if (this.isElite) {
      this.sprite.setTint(0xffaa00);
    } else {
      this.sprite.clearTint();
    }
  }

  takeDamage(dmg, isCrit, fromDir, game) {
    if (this.dead) return;
    const actual = Math.max(1, dmg - this.def);
    this.hp -= actual;
    this.hitFlash = 0.15;
    this.hitKnockbackTimer = 0.12;
    this.hitKnockbackDir = fromDir + Math.PI;

    if (game && game.effectManager) {
      game.effectManager.addText(this.x, this.y - this.radius - 20, isCrit ? `暴击! ${actual}` : `${actual}`, isCrit ? '#ffd700' : '#ff4444', isCrit ? 22 : 16, '#000');
      // 受击粒子：血雾 + 火星
      game.effectManager.addParticles(this.x, this.y, '#ff4444', isCrit ? 12 : 6, isCrit ? 110 : 80, 4);
      game.effectManager.addParticles(this.x, this.y, '#ff8800', isCrit ? 6 : 3, isCrit ? 90 : 60, 2);
      if (isCrit) {
        game.effectManager.shakeScreen(3);
        game.effectManager.flashScreen('#ffaa00', 0.05);
      }
    }

    if (this.hp <= 0) {
      if (this.type === 'boss' && !this.hasRevived) {
        this.dead = true;
        this.deathTimer = 0.6;   // 死亡淡出动画时长
        this.reviveTimer = 60;   // 复活等待（独立计时）
        this.hasRevived = true;
        if (game.onBossFirstDeath) game.onBossFirstDeath(this);
      } else {
        this.dead = true;
        this.deathTimer = 0.6;
        if (game && game.effectManager) {
          const isBoss = this.type === 'boss' || this.type === 'lubu' || this.type === 'dianwei' || this.type === 'xuzhu';
          // 死亡粒子：血雾 + 烟雾 + 火星
          game.effectManager.addParticles(this.x, this.y, '#ff4444', isBoss ? 35 : 15, isBoss ? 170 : 100, isBoss ? 5 : 3);
          game.effectManager.addParticles(this.x, this.y, '#ff8800', isBoss ? 20 : 8, isBoss ? 130 : 80, 3);
          game.effectManager.addParticles(this.x, this.y - this.radius, '#888888', isBoss ? 12 : 5, isBoss ? 90 : 50, isBoss ? 6 : 4);
          if (isBoss) {
            game.effectManager.shakeScreen(8);
            game.effectManager.flashScreen('#ff0000', 0.2);
          }
        }
        game.onEnemyKilled(this);
      }
    }
  }

  reviveBoss() {
    this.dead = false;
    this.reviveTimer = 0;
    this.maxHp = Math.floor(this.baseMaxHp * 2);
    this.hp = this.maxHp;
    this.atk = Math.floor(this.baseAtk * 2);
    this.def = Math.floor(this.baseDef * 2);
    this.baseMaxHp = this.maxHp;
    this.baseAtk = this.atk;
    this.baseDef = this.def;
    this.radius = this.baseRadius * this.sizeScale;

    // 重置死亡动画留下的视觉状态
    if (this.sprite) {
      this.sprite.setAlpha(1);
      this.sprite.setRotation(0);
      this.sprite.setScale(this.getBaseSpriteScale() * this.sizeScale);
      this.sprite.clearTint();
    }
    if (this.hpBarBg) this.hpBarBg.setVisible(true);
    if (this.hpBarFill) {
      this.hpBarFill.setVisible(true);
      this.updateHpBar();
    }
    if (this.nameLabel) this.nameLabel.setVisible(true);
  }

  update(dt, game) {
    if (this.dead) {
      // 死亡淡出动画计时（与复活等待分离）
      if (this.deathTimer > 0) this.deathTimer -= dt;
      // Boss 首次死亡后倒计时复活
      if (this.type === 'boss' && this.reviveTimer > 0) {
        this.reviveTimer -= dt;
        if (this.reviveTimer <= 0) {
          this.reviveBoss();
          if (game.onBossRevived) game.onBossRevived(this);
        }
      }
      this.syncSprite();
      return;
    }

    if (this.attacking) {
      this.attackAnimTimer -= dt;
      if (this.attackAnimTimer <= 0) {
        this.attacking = false;
        this.isUltimate = false;
        this.isSkill = false;
      }
    }

    if (this.hitKnockbackTimer > 0) {
      this.hitKnockbackTimer -= dt;
      // 速度随剩余时间线性衰减（0.12s 为 takeDamage 中设定的击退总时长）
      const KNOCKBACK_DUR = 0.12;
      const ratio = Math.max(0, this.hitKnockbackTimer / KNOCKBACK_DUR);
      const kbSpeed = 120 * ratio;
      this.x += Math.cos(this.hitKnockbackDir) * kbSpeed * dt;
      this.y += Math.sin(this.hitKnockbackDir) * kbSpeed * dt;
    }

    this.hitFlash -= dt;
    this.attackCd -= dt;
    this.stateTimer -= dt;

    if ((this.type === 'boss' || this.type === 'lubu' || this.type === 'dianwei' || this.type === 'xuzhu') && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * this.hpRegen * dt);
    }

    if ((this.type === 'boss' || this.type === 'lubu') && !this.enraged && this.hp <= this.maxHp * 0.5) {
      this.enraged = true;
      this.sizeScale = 1.5;
      this.radius = this.baseRadius * this.sizeScale;
    }

    const isMoving = this.state === 'chase' || this.state === 'wander';
    const p = game.player;
    const dist = vdist(vec(this.x, this.y), vec(p.x, p.y));

    // 魅惑状态：不追击玩家，随机游荡
    if (this.charmed) {
      this.charmTimer -= dt;
      if (this.charmTimer <= 0) {
        this.charmed = false;
        this.charmTimer = 0;
        this._restoreTint();
      } else {
        this.state = 'wander';
        if (this.stateTimer <= 0) {
          this.stateTimer = rand(0.5, 1.5);
          this.dir = Math.random() * Math.PI * 2;
        }
        const wanderSpeed = this.speed * ENEMY_WANDER_SPEED_RATIO;
        this.x += Math.cos(this.dir) * wanderSpeed * dt;
        this.y += Math.sin(this.dir) * wanderSpeed * dt;
        this.clampPos();
        this.syncSprite();
        return;
      }
    }

    if (!this.aggro && dist < ENEMY_AGGRO_RANGE) this.aggro = true;
    if (this.aggro && dist > ENEMY_LOSE_AGGRO_RANGE) this.aggro = false;

    if (this.aggro) {
      this.state = 'chase';
      const dir = vnorm(vsub(vec(p.x, p.y), vec(this.x, this.y)));
      this.dir = Math.atan2(dir.y, dir.x);
      const chaseSpeed = this.speed * ENEMY_CHASE_SPEED_RATIO;

      if (this.ranged) {
        this.dir = Math.atan2(p.y - this.y, p.x - this.x);
        if (this.attacking) {
          if (!this.arrowFired && this.attackAnimTimer <= 0.25) {
            this.arrowFired = true;
            const a = this.dir + rand(-0.15, 0.15);
            game.projectiles.push(new Projectile(this.scene, this.x, this.y, a, 260, this.atk, 'enemy', '#ffaa00', 6, 2.5));
          }
        } else {
          if (dist < 150) {
            this.x -= dir.x * chaseSpeed * dt;
            this.y -= dir.y * chaseSpeed * dt;
          }
          this.shootTimer -= dt;
          if (this.shootTimer <= 0) {
            this.shootTimer = this.shootCd;
            this.attacking = true;
            this.attackAnimTimer = 0.5;
            this.arrowFired = false;
          }
        }
      } else {
        if (dist > this.radius + p.radius + 10) {
          this.x += dir.x * chaseSpeed * dt;
          this.y += dir.y * chaseSpeed * dt;
        } else if (this.attackCd <= 0) {
          const canUltimate = (this.type === 'boss' || this.type === 'lubu' || this.type === 'dianwei' || this.type === 'xuzhu') && Math.random() < 0.1;
          if (canUltimate) {
            this.isUltimate = true;
            this.attackCd = 3.0;
            this.attackAnimTimer = 0.9;
            this.attacking = true;
            const ultRange = (this.radius + p.radius + 10) * 2.5;
            if (dist <= ultRange) {
              p.takeDamage(Math.floor(this.atk * 1.5), game);
            }
          } else {
            this.isUltimate = false;
            // 若存在 skill 动画，20% 概率播放小技能/重击，增加变化
            this.isSkill = this.scene.anims.exists(`${this.spriteConfig.type}_skill`) && Math.random() < 0.2;
            this.attackCd = this.isSkill ? 1.5 : 1.0;
            this.attacking = true;
            this.attackAnimTimer = this.isSkill ? 0.7 : 0.5;
            p.takeDamage(this.isSkill ? Math.floor(this.atk * 1.3) : this.atk, game);
          }
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

    this.clampPos();

    this.syncSprite();
  }

  clampPos() {
    this.x = Math.max(this.radius, Math.min(MAP_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(MAP_H - this.radius, this.y));
  }

  syncSprite() {
    if (!this.sprite) return;
    this.sprite.setPosition(this.x, this.y);

    if (this.dead) {
      const FADE_DUR = 0.6;
      const progress = Math.max(0, Math.min(1, this.deathTimer / FADE_DUR));
      this.sprite.setAlpha(progress);
      const baseScale = this.getBaseSpriteScale() * this.sizeScale;
      this.sprite.setScale(baseScale * (0.6 + 0.4 * progress));
      this.sprite.setRotation((1 - progress) * (Math.PI / 6) * (this.x > MAP_W / 2 ? -1 : 1));
      if (this.hpBarBg) this.hpBarBg.setVisible(false);
      if (this.hpBarFill) this.hpBarFill.setVisible(false);
      if (this.nameLabel) this.nameLabel.setVisible(false);
      return;
    }

    const barY = this.y - this.radius * this.sizeScale - 15;
    if (this.hpBarBg) this.hpBarBg.setPosition(this.x, barY);
    if (this.hpBarFill) {
      const barW = 60 * this.sizeScale;
      this.hpBarFill.setPosition(this.x - barW / 2, barY);
      this.updateHpBar();
    }
    if (this.nameLabel) {
      this.nameLabel.setPosition(this.x, this.y - this.radius * this.sizeScale - 28);
      const text = `Lv.${this.level} ${this.name}`;
      if (this._lastNameText !== text) {
        this.nameLabel.text = text;
        this._lastNameText = text;
      }
    }

    if (this.hitFlash > 0) {
      this.sprite.setTint(0xffffff);
    } else if (this.charmed) {
      this.sprite.setTint(0xff69b4);
    } else if (this.isElite) {
      this.sprite.setTint(0xffaa00);
    } else {
      this.sprite.clearTint();
    }

    const isMoving = this.state === 'chase' || this.state === 'wander';
    const type = this.spriteConfig.type;

    if (this.attacking) {
      let anim = `${type}_attack`;
      if (this.isUltimate) {
        anim = this.scene.anims.exists(`${type}_ultimate`) ? `${type}_ultimate` : `${type}_attack`;
      } else if (this.isSkill) {
        anim = this.scene.anims.exists(`${type}_skill`) ? `${type}_skill` : `${type}_attack`;
      }
      this.playAnimationOnce(anim);
    } else if (isMoving) {
      if (type === 'archer' && this.aggro) {
        // 弓箭手追踪时面向玩家，使用切片
        this.setSliceTexture();
      } else if (type === 'general' || type === 'spearman') {
        // 曹将/枪兵按四方向播放 walk 动画（left 复用 right + flipX）
        const walkDir = AssetLoader.resolveWalkDir4(this.dir);
        const walkKey = `${type}_walk_${walkDir}`;
        if (this.scene.anims.exists(walkKey)) {
          this.sprite.play(walkKey, true);
        } else {
          this.setSliceTexture();
        }
      } else if (this.scene.anims.exists(`${type}_walk`)) {
        this.sprite.play(`${type}_walk`, true);
      } else {
        this.setSliceTexture();
      }
    } else {
      this.setSliceTexture();
    }

    // flipX 处理
    const a = this.dir;
    let flipX = false;
    if (type === 'lubu' || type === 'cavalry' || type === 'archer' || type === 'xuzhu') {
      flipX = a >= -Math.PI / 2 && a <= Math.PI / 2;
    } else if (this.attacking && (type === 'spearman' || type === 'general')) {
      flipX = a > Math.PI / 2 || a < -Math.PI / 2;
    } else {
      flipX = a > Math.PI / 2 || a < -Math.PI / 2;
    }
    this.sprite.setFlipX(flipX);

    const s = this.sizeScale;
    this.sprite.setScale(this.getBaseSpriteScale() * s);
  }

  setSliceTexture() {
    const key = AssetLoader.getEnemySliceKey(this.spriteConfig.type, this.dir);
    if (AssetLoader.hasTexture(this.scene, key)) {
      this.sprite.stop();
      this.sprite.setTexture(key);
    }
  }

  playAnimationOnce(key) {
    if (!this.scene.anims.exists(key)) return;
    const current = this.sprite.anims.currentAnim;
    if (current && current.key === key && this.sprite.anims.isPlaying) return;
    this.sprite.play(key, true);
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.hpBarBg) {
      this.hpBarBg.destroy();
      this.hpBarBg = null;
    }
    if (this.hpBarFill) {
      this.hpBarFill.destroy();
      this.hpBarFill = null;
    }
    if (this.nameLabel) {
      this.nameLabel.destroy();
      this.nameLabel = null;
    }
  }
}
