import { MAP_W, MAP_H, ENEMY_TYPES, ENEMY_AGGRO_RANGE, ENEMY_LOSE_AGGRO_RANGE, ENEMY_CHASE_SPEED_RATIO, ENEMY_WANDER_SPEED_RATIO, isBossType, ENEMY_COMBAT_CONFIG } from '../../config/index.js';
import { rand, randInt, vdist, vsub, vnorm, vec, resolveTerrainCollision } from '../utils/index.js';
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

    const scale = 1 + (level - 1) * ENEMY_COMBAT_CONFIG.levelScaling.hp;
    this.maxHp = Math.floor(t.hp * scale);
    this.hp = this.maxHp;
    this.atk = Math.floor(t.atk * (1 + (level - 1) * ENEMY_COMBAT_CONFIG.levelScaling.atk));
    this.def = Math.floor(t.def * (1 + (level - 1) * ENEMY_COMBAT_CONFIG.levelScaling.def));
    this.speed = t.speed;
    this.exp = Math.floor(t.exp * (1 + (level - 1) * ENEMY_COMBAT_CONFIG.levelScaling.exp));
    this.score = t.score;
    this.dropRate = t.dropRate;
    this.ranged = t.ranged || false;
    this.shootCd = t.shootCd || 0;
    this.shootTimer = rand(ENEMY_COMBAT_CONFIG.attack.shootTimerMin, ENEMY_COMBAT_CONFIG.attack.shootTimerMax);

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
    this._originalBaseMaxHp = this.baseMaxHp;
    this._originalBaseAtk = this.baseAtk;
    this._originalBaseDef = this.baseDef;
    this.sizeScale = 1;
    this.hpRegen = (type === 'boss' || type === 'lubu') ? ENEMY_COMBAT_CONFIG.boss.hpRegen : 0;
    this.hasRevived = options.skipRevive ? true : false;
    this.reviveTimer = 0;
    this.enraged = false;
    this.enhanced = options.enhanced || false;
    this.charmed = false;
    this.charmTimer = 0;

    if (this.enhanced && type === 'boss') {
      const cfg = ENEMY_COMBAT_CONFIG.enhanced;
      this.maxHp = Math.floor(this.maxHp * cfg.hpMult);
      this.hp = this.maxHp;
      this.baseMaxHp = this.maxHp;
      this.atk = Math.floor(this.atk * cfg.atkMult);
      this.def = Math.floor(this.def * cfg.defMult);
      this.baseAtk = this.atk;
      this.baseDef = this.def;
      this._originalBaseMaxHp = this.baseMaxHp;
      this._originalBaseAtk = this.baseAtk;
      this._originalBaseDef = this.baseDef;
      this.sizeScale = cfg.sizeScale;
      this.updateHitbox();
      this.hpRegen = cfg.hpRegen;
    }

    this.spriteConfig = SPRITE_CONFIG[type] || SPRITE_CONFIG.soldier;
    this.baseSpriteScale = null;
    this.createGroundShadow();
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

  // 受击判定半径：随体型缩放同步更新，确保 boss 变大后命中范围也变大
  updateHitbox() {
    this.radius = this.baseRadius * this.sizeScale;
  }

  getHpBarColor() {
    const tints = ENEMY_COMBAT_CONFIG.tints;
    if (this.type === 'boss' || this.type === 'lubu') return tints.boss;
    if (['general', 'dianwei', 'xuzhu'].includes(this.type)) return tints.general;
    return tints.default;
  }

  createGroundShadow() {
    this.shadow = this.scene.add.ellipse(
      this.x,
      this.y + this.radius * 0.72,
      this.radius * 2.15,
      this.radius * 0.62,
      0x120d09,
      0.34
    );
    this.shadow.setDepth(4);
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
    const cfg = ENEMY_COMBAT_CONFIG.hpBar;
    const barW = cfg.width * this.sizeScale;
    const barH = cfg.height * this.sizeScale;
    const yOffset = -this.radius - cfg.yOffset;

    this.hpBarBg = this.scene.add.rectangle(this.x, this.y + yOffset, barW, barH, 0x000000);
    this.hpBarBg.setDepth(15);

    this.hpBarFill = this.scene.add.rectangle(this.x - barW / 2, this.y + yOffset, barW, barH, this.getHpBarColor());
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(16);
  }

  createNameLabel() {
    const cfg = ENEMY_COMBAT_CONFIG.hpBar;
    const yOffset = -this.radius - cfg.nameYOffset;
    this.nameLabel = this.scene.add.text(this.x, this.y + yOffset, `Lv.${this.level} ${this.name}`, {
      fontFamily: 'Noto Serif SC',
      fontSize: `${cfg.fontSize * this.sizeScale}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(17);
  }

  updateHpBar() {
    if (!this.hpBarFill || !this.hpBarBg) return;
    const cfg = ENEMY_COMBAT_CONFIG.hpBar;
    const ratio = Math.max(0, this.hp / this.maxHp);
    const barW = cfg.width * this.sizeScale;
    this.hpBarFill.width = barW * ratio;
  }

  applyCharm(duration) {
    this.charmed = true;
    this.charmTimer = duration;
    if (this.sprite) this.sprite.setTint(ENEMY_COMBAT_CONFIG.tints.charmed);
  }

  _restoreTint() {
    if (!this.sprite) return;
    if (this.isElite) {
      this.sprite.setTint(ENEMY_COMBAT_CONFIG.tints.elite);
    } else {
      this.sprite.clearTint();
    }
  }

  takeDamage(dmg, isCrit, fromDir, game) {
    if (this.dead) return;
    const actual = Math.max(1, dmg - this.def);
    this.hp -= actual;
    const cfg = ENEMY_COMBAT_CONFIG;
    this.hitFlash = cfg.knockback.duration + 0.03;
    this.hitKnockbackTimer = cfg.knockback.duration;
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
        this.deathTimer = ENEMY_COMBAT_CONFIG.boss.deathFadeDuration;
        this.reviveTimer = ENEMY_COMBAT_CONFIG.boss.reviveTimer;
        this.hasRevived = true;
        if (game.onBossFirstDeath) game.onBossFirstDeath(this);
      } else {
        this.dead = true;
        this.deathTimer = ENEMY_COMBAT_CONFIG.boss.deathFadeDuration;
        if (game && game.effectManager) {
          const isBoss = isBossType(this.type);
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
    const cfg = ENEMY_COMBAT_CONFIG.boss;
    this.maxHp = Math.floor(this._originalBaseMaxHp * cfg.reviveHpMult);
    this.hp = this.maxHp;
    this.atk = Math.floor(this._originalBaseAtk * cfg.reviveAtkMult);
    this.def = Math.floor(this._originalBaseDef * cfg.reviveDefMult);
    this.baseMaxHp = this.maxHp;
    this.baseAtk = this.atk;
    this.baseDef = this.def;
    this.updateHitbox();

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
      const cfg = ENEMY_COMBAT_CONFIG.knockback;
      const ratio = Math.max(0, this.hitKnockbackTimer / cfg.duration);
      const kbSpeed = cfg.speed * ratio;
      this.x += Math.cos(this.hitKnockbackDir) * kbSpeed * dt;
      this.y += Math.sin(this.hitKnockbackDir) * kbSpeed * dt;
    }

    this.hitFlash -= dt;
    this.attackCd -= dt;
    this.stateTimer -= dt;

    if (isBossType(this.type) && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * this.hpRegen * dt);
    }

    if ((this.type === 'boss' || this.type === 'lubu') && !this.enraged && this.hp <= this.maxHp * ENEMY_COMBAT_CONFIG.boss.enrageHpThreshold) {
      this.enraged = true;
      this.sizeScale = ENEMY_COMBAT_CONFIG.boss.enrageSizeScale;
      this.updateHitbox();
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
        const st = ENEMY_COMBAT_CONFIG.state;
        if (this.stateTimer <= 0) {
          this.stateTimer = rand(st.wanderTimerMin, st.wanderTimerMax);
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
        const cfg = ENEMY_COMBAT_CONFIG.attack;
        if (this.attacking) {
          if (!this.arrowFired && this.attackAnimTimer <= 0.25) {
            this.arrowFired = true;
            const a = this.dir + rand(-cfg.rangedAimJitter, cfg.rangedAimJitter);
            game.projectiles.push(new Projectile(this.scene, this.x, this.y, a, cfg.rangedProjectileSpeed, this.atk, 'enemy', '#ffaa00', cfg.rangedProjectileSize, cfg.rangedProjectileLife));
          }
        } else {
          if (dist < cfg.rangedFleeDistance) {
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
          const cfg = ENEMY_COMBAT_CONFIG.attack;
          const canUltimate = isBossType(this.type) && Math.random() < cfg.ultimateChance;
          if (canUltimate) {
            this.isUltimate = true;
            this.attackCd = cfg.ultimateCd;
            this.attackAnimTimer = cfg.ultimateAnimTimer;
            this.attacking = true;
            const ultRange = (this.radius + p.radius + 10) * 2.5;
            if (dist <= ultRange) {
              p.takeDamage(Math.floor(this.atk * cfg.ultimateDamageMult), game);
            }
          } else {
            this.isUltimate = false;
            this.isSkill = this.scene.anims.exists(`${this.spriteConfig.type}_skill`) && Math.random() < 0.2;
            this.attackCd = this.isSkill ? cfg.skillCd : cfg.baseCd;
            this.attacking = true;
            this.attackAnimTimer = this.isSkill ? cfg.skillAnimTimer : cfg.baseAnimTimer;
            p.takeDamage(this.isSkill ? Math.floor(this.atk * cfg.skillDamageMult) : this.atk, game);
          }
        }
      }
    } else {
      const st = ENEMY_COMBAT_CONFIG.state;
      if (this.stateTimer <= 0) {
        this.stateTimer = rand(st.idleTimerMin, st.idleTimerMax);
        this.dir = Math.random() * Math.PI * 2;
        this.state = Math.random() > st.idleChance ? 'wander' : 'idle';
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
    resolveTerrainCollision(this, 12);
    this.x = Math.max(this.radius, Math.min(MAP_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(MAP_H - this.radius, this.y));
  }

  syncSprite() {
    if (!this.sprite) return;
    this.updateHitbox();
    this.sprite.setPosition(this.x, this.y);
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + this.radius * 0.72);
      this.shadow.setDisplaySize(this.radius * 2.15, this.radius * 0.62);
      this.shadow.setAlpha(this.dead ? 0.1 : 0.34);
    }

    if (this.dead) {
      const cfg = ENEMY_COMBAT_CONFIG;
      const FADE_DUR = cfg.boss.deathFadeDuration;
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

    const cfg = ENEMY_COMBAT_CONFIG;
    const barY = this.y - this.radius - cfg.hpBar.yOffset;
    if (this.hpBarBg) this.hpBarBg.setPosition(this.x, barY);
    if (this.hpBarFill) {
      const barW = cfg.hpBar.width * this.sizeScale;
      this.hpBarFill.setPosition(this.x - barW / 2, barY);
      this.updateHpBar();
    }
    if (this.nameLabel) {
      this.nameLabel.setPosition(this.x, this.y - this.radius - cfg.hpBar.nameYOffset);
      const text = `Lv.${this.level} ${this.name}`;
      if (this._lastNameText !== text) {
        this.nameLabel.text = text;
        this._lastNameText = text;
      }
    }

    if (this.hitFlash > 0) {
      this.sprite.setTint(cfg.tints.hitFlash);
    } else if (this.charmed) {
      this.sprite.setTint(cfg.tints.charmed);
    } else if (this.isElite) {
      this.sprite.setTint(cfg.tints.elite);
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
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
  }
}
