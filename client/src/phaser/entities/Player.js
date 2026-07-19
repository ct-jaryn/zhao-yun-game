import { MAP_W, MAP_H, SKILLS, EQUIP_TYPES, QUALITY, BOSS_TYPES, HERO_COMBAT_CONFIG } from '../../config/index.js';
import { vnorm, vec, vdist, angleDiff, pick, resolveTerrainCollision } from '../utils/index.js';
import { AssetLoader } from '../plugins/AssetLoader.js';
import { createInitialEquip } from '../systems/EquipmentFactory.js';

export class Player {
  constructor(scene, x, y, combatStats = null) {
    const stats = combatStats || {};
    this.scene = scene;
    this.skin = stats.skin || 'classic';
    this.heroId = stats.heroId || 'zhaoyun';
    this.x = x;
    this.y = y;
    this.dir = 0;
    this.speed = stats.spd || 200;
    this.radius = stats.radius || 36;

    this.level = 1;
    this.exp = 0;
    this.expToLevel = HERO_COMBAT_CONFIG.levelExp.base;
    this.maxHp = stats.maxHp || 150;
    this.hp = this.maxHp;
    this.maxMp = stats.maxMp || 80;
    this.mp = this.maxMp;
    this.baseAtk = stats.atk || 20;
    this.baseDef = stats.def || 8;
    this.critRate = stats.crit || 5;
    this.mpRegen = stats.mpRegen || 3;
    this.hpRegen = stats.hpRegen || 1;
    this.passive = stats.passive || null;
    this.skillDamageMult = stats.skillDamageMult || [1, 1, 1, 1, 1];
    this.skillBranches = stats.skillBranches || [];
    this.skillBranchSelections = stats.skillBranchSelections || {};
    this.talentEffects = stats.talentEffects || [];

    this.equip = stats.equipment || createInitialEquip();
    this.skillCd = [0, 0, 0, 0, 0];
    this.attacking = false;
    this.attackTimer = 0;
    this.currentSkill = 0;
    this.dodging = false;
    this.dodgeTimer = 0;
    this.dodgeDir = 0;
    this.dodgeCd = 0;
    this.dodgeSpeed = 0;
    this.invulnTimer = 0;
    this.flashTimer = 0;
    this.hurtTimer = 0;
    this.dead = false;
    this.deathAnimPaused = false;

    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;

    this.bonusAtk = 0;
    this.bonusDef = 0;
    this.bonusCrit = 0;
    this.bonusSpd = 0;
    this.bonusCdr = 0;
    this.bonusHp = 0;
    this.bonusHpRegen = 0;
    this.bonusMpRegen = 0;

    this.moving = false;
    this.mouseAim = false;

    this.animPrefix = this.skin === 'mecha' ? 'mecha_player' : 'player';
    this.createGroundShadow();
    this.createSprite();
  }

  get atk() {
    let v = this.baseAtk + this.level * 3;
    if (this.equip['武器']) v += this.equip['武器'].stats.atk || 0;
    return Math.floor(v * (1 + this.bonusAtk));
  }
  get def() {
    let v = this.baseDef + this.level;
    for (const k of ['铠甲', '头盔']) if (this.equip[k]) v += this.equip[k].stats.def || 0;
    return Math.floor(v * (1 + this.bonusDef));
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

  getSkillBranchEffects(skillIdx) {
    const branches = this.skillBranches[skillIdx];
    if (!branches) return {};
    const selectedId = this.skillBranchSelections[skillIdx];
    if (!selectedId) return {};
    const branch = branches.find(b => b.id === selectedId);
    return branch ? (branch.effects || {}) : {};
  }

  addExp(v, game) {
    this.exp += v;
    const cfg = HERO_COMBAT_CONFIG;
    while (this.exp >= this.expToLevel) {
      this.exp -= this.expToLevel;
      this.level++;
      this.expToLevel = Math.floor(this.expToLevel * cfg.levelExp.growth);
      if (cfg.levelUp.restoreHp) this.hp = this.maxHpTotal;
      if (cfg.levelUp.restoreMp) this.mp = this.maxMpTotal;
      this.baseAtk += cfg.levelUp.atkBonus;
      this.baseDef += cfg.levelUp.defBonus;
      game.addText(this.x, this.y - 50, `升级! Lv.${this.level}`, '#ffd700', 26, '#000');
      game.addParticles(this.x, this.y, '#ffd700', 25, 120);
      game.shakeScreen(4);
      game.flashScreen('#ffd700', 0.2);
      game.showLevelUp();
    }
  }

  createGroundShadow() {
    this.shadow = this.scene.add.ellipse(
      this.x,
      this.y + this.radius * 0.72,
      this.radius * 2.2,
      this.radius * 0.62,
      0x120d09,
      0.42
    );
    this.shadow.setDepth(4);
  }

  createSprite() {
    const key = AssetLoader.getPlayerSliceKey(this.skin, this.dir);
    if (AssetLoader.hasTexture(this.scene, key)) {
      this.sprite = this.scene.add.sprite(this.x, this.y, key);
      this.updateScale();
    } else {
      this.sprite = this.scene.add.sprite(this.x, this.y, '__WHITE');
      this.sprite.setDisplaySize(this.radius * 2, this.radius * 2);
      this.sprite.setTint(0xcc2222);
    }
    this.sprite.setDepth(10);
    this.updateFlip();
  }

  updateScale() {
    if (!this.sprite || !this.sprite.texture) return;
    const source = this.sprite.texture.getSourceImage();
    if (!source || source.height <= 0) return;
    const targetH = this.skin === 'mecha' ? HERO_COMBAT_CONFIG.sprite.targetHeightMecha : HERO_COMBAT_CONFIG.sprite.targetHeightClassic;
    const scale = targetH / source.height;
    this.sprite.setScale(scale);
  }

  update(dt, input, game) {
    const maxHp = this.maxHpTotal;
    const maxMp = this.maxMpTotal;
    this.hp = Math.min(maxHp, this.hp + this.hpRegen * (1 + this.bonusHpRegen) * dt);
    this.mp = Math.min(maxMp, this.mp + this.mpRegen * (1 + this.bonusMpRegen) * dt);
    for (let i = 0; i < 5; i++) {
      if (this.skillCd[i] > 0) this.skillCd[i] -= dt;
    }
    if (this.dodgeCd > 0) this.dodgeCd -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    this.applyPassives(dt, game);

    if (this.dead) {
      this.syncSprite();
      return;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        if (this.combo >= HERO_COMBAT_CONFIG.combo.interruptionTextThreshold) game.addText(this.x, this.y - 70, '连击中断!', '#888', 16, '#000');
        this.combo = 0;
      }
    }

    if (this.dodging) {
      this.dodgeTimer -= dt;
      this.x += Math.cos(this.dodgeDir) * this.dodgeSpeed * dt;
      this.y += Math.sin(this.dodgeDir) * this.dodgeSpeed * dt;
      if (this.dodgeTimer <= 0) {
        this.dodging = false;
      }
      this.clampPos();
      this.syncSprite();
      return;
    }

    if (this.attacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attacking = false;
      }
    }

    let dx = 0, dy = 0;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) dx -= 1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) dx += 1;
    if (input.isDown('ArrowUp') || input.isDown('KeyW')) dy -= 1;
    if (input.isDown('ArrowDown') || input.isDown('KeyS')) dy += 1;

    this.moving = dx !== 0 || dy !== 0;

    const aim = input.mouseAim && input.mouse.down
      ? Math.atan2(input.mouse.worldY - this.y, input.mouse.worldX - this.x)
      : null;

    if (this.moving) {
      const d = vnorm(vec(dx, dy));
      this.x += d.x * this.speedTotal * dt;
      this.y += d.y * this.speedTotal * dt;
      if (!this.mouseAim) this.dir = Math.atan2(d.y, d.x);
    }

    if (aim !== null) {
      this.dir = aim;
      this.mouseAim = true;
    } else {
      this.mouseAim = false;
    }

    this.clampPos();
    this.syncSprite();

    if (input.justDown('KeyJ')) this.useSkill(0, game);
    if (input.justDown('KeyK')) this.useSkill(1, game);
    if (input.justDown('KeyL')) this.useSkill(2, game);
    if (input.justDown('KeyU')) this.useSkill(3, game);
    if (input.justDown('KeyI')) this.useSkill(4, game);
    if (input.justDown('Space')) this.dodge(game);
  }

  clampPos() {
    this.x = Math.max(this.radius, Math.min(MAP_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(MAP_H - this.radius, this.y));
    resolveTerrainCollision(this, 12);
    this.x = Math.max(this.radius, Math.min(MAP_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(MAP_H - this.radius, this.y));
  }

  syncSprite() {
    this.sprite.setPosition(this.x, this.y);
    this.updateFlip();
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + this.radius * 0.72);
      this.shadow.setAlpha(this.dead ? 0.12 : this.dodging ? 0.2 : 0.42);
    }

    if (this.dead) {
      const key = `${this.animPrefix}_death`;
      if (this.scene.anims.exists(key)) {
        const current = this.sprite.anims.currentAnim;
        if (!this.deathAnimPaused && (!current || current.key !== key)) {
          this.sprite.play(key, true);
          this.sprite.once('animationcomplete', () => {
            if (this.sprite && this.sprite.anims) {
              this.sprite.anims.pause();
              this.deathAnimPaused = true;
            }
          });
        }
      }
      return;
    }

    if (this.dodging) {
      this.playAnimationOnce('dodge');
      return;
    }

    if (this.hurtTimer > 0) {
      this.playAnimationOnce('hurt');
      return;
    }

    if (this.attacking) {
      const key = this.currentSkill === 4 ? 'ultimate' : `skill_${this.currentSkill}`;
      this.playAnimationOnce(key);
      return;
    }

    if (this.moving) {
      this.playLoopAnimation('walk');
      return;
    }

    this.sprite.stop();
    const sliceKey = AssetLoader.getPlayerSliceKey(this.skin, this.dir);
    if (AssetLoader.hasTexture(this.scene, sliceKey)) {
      this.sprite.setTexture(sliceKey);
      this.updateScale();
    }
  }

  updateFlip() {
    let flipX = false;
    if (this.moving || this.attacking || this.dodging) {
      const a = this.dodging ? this.dodgeDir : this.dir;
      flipX = a >= -Math.PI / 2 && a <= Math.PI / 2;
    }
    this.sprite.setFlipX(flipX);
  }

  showAttackArc(range, arc) {
    if (!this.scene) return;
    const g = this.scene.add.graphics();
    g.setDepth(9);
    const start = this.dir - arc / 2;
    const end = this.dir + arc / 2;
    g.fillStyle(0xffdd99, 0.10);
    g.slice(this.x, this.y, range, start, end, false);
    g.fillPath();
    g.lineStyle(1.5, 0xffeecc, 0.28);
    g.beginPath();
    g.arc(this.x, this.y, range, start, end);
    g.strokePath();
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 220,
      onComplete: () => g.destroy()
    });
  }

  playLoopAnimation(name) {
    const key = `${this.animPrefix}_${name}`;
    if (this.scene.anims.exists(key)) {
      this.sprite.play(key, true);
    }
  }

  playAnimationOnce(name) {
    const key = `${this.animPrefix}_${name}`;
    if (!this.scene.anims.exists(key)) return;
    const current = this.sprite.anims.currentAnim;
    if (current && current.key === key && this.sprite.anims.isPlaying) return;
    this.sprite.play(key, true);
  }

useSkill(idx, game) {
    if (this.attacking || this.dodging || this.dead) return;
    const sk = SKILLS[idx];
    const branchEffects = this.getSkillBranchEffects(idx);
    const cd = sk.cd * (branchEffects.cooldownMult || 1) * (1 - this.bonusCdr);
    const skillRange = sk.range * (branchEffects.rangeMult || 1);
    if (this.skillCd[idx] > 0) return;
    if (this.mp < sk.mp) {
      game.addText(this.x, this.y - 30, '法力不足!', '#4488ff', 14, '#000');
      return;
    }

    this.mp -= sk.mp;
    this.skillCd[idx] = cd;
    this.attacking = true;
    this.attackTimer = HERO_COMBAT_CONFIG.skillCast.attackTimerBase + idx * HERO_COMBAT_CONFIG.skillCast.attackTimerStep;
    this.currentSkill = idx;

    // 锁定本次技能释放方向：鼠标按住瞄准时取鼠标方向，否则取当前面向
    const input = this.scene.inputManager;
    let skillDir = this.dir;
    if (input && input.mouseAim && input.mouse.down) {
      skillDir = Math.atan2(input.mouse.worldY - this.y, input.mouse.worldX - this.x);
    }

    if (idx === 2) {
      const dashCfg = HERO_COMBAT_CONFIG.skillCast.dash;
      this.x += Math.cos(skillDir) * dashCfg.distance;
      this.y += Math.sin(skillDir) * dashCfg.distance;
      this.clampPos();
      for (let i = 0; i < dashCfg.particleCount; i++) {
        const t = i / dashCfg.particleCount;
        game.addParticles(this.x - Math.cos(skillDir) * dashCfg.distance * t, this.y - Math.sin(skillDir) * dashCfg.distance * t, '#ff8844', 1, 40, 4);
      }
    }

    // 普通攻击自动朝向最近敌人，且与玩家重叠的敌人必定命中
    if (idx === 0) {
      const input = this.scene.inputManager;
      if (!input || !input.mouseAim || !input.mouse.down) {
        let nearest = null;
        let nearestDist = Infinity;
        for (const e of game.enemies) {
          if (e.dead) continue;
          const dist = vdist(vec(this.x, this.y), vec(e.x, e.y));
          if (dist > skillRange + e.radius + this.radius) continue;
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = e;
          }
        }
        if (nearest) {
          skillDir = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        }
      }
    }

    const hits = [];
    for (const e of game.enemies) {
      if (e.dead) continue;
      const dist = vdist(vec(this.x, this.y), vec(e.x, e.y));
      if (dist > skillRange + e.radius + this.radius) continue;
      const angleTo = Math.atan2(e.y - this.y, e.x - this.x);
      const inArc = Math.abs(angleDiff(angleTo, skillDir)) <= sk.arc / 2;
      const overlapping = dist <= this.radius + e.radius + HERO_COMBAT_CONFIG.damage.overlappingExtraDistance;
      if (inArc || overlapping) hits.push(e);
    }

    for (const e of hits) {
      game.hitEnemyWithSkill(e, idx);
    }

    if (idx === 0) {
      this.showAttackArc(skillRange + this.radius, sk.arc);
    }

    if (idx === 4) {
      const ult = HERO_COMBAT_CONFIG.skillCast.ultimate;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        game.addProjectile(this.x, this.y, a, ult.projectileSpeed, this.atk * ult.projectileDmgRatio, 'player', '#ffd700', ult.projectileSize, ult.projectileLife, null, true);
      }
      game.addParticles(this.x, this.y, '#ffd700', ult.particleCount, ult.particleSpeed);
      game.shakeScreen(ult.shake);
      game.flashScreen('#ffd700', ult.flashDuration);
    }

    if (idx === 3) {
      const sk3 = HERO_COMBAT_CONFIG.skillCast.skill3;
      game.addParticles(this.x, this.y, '#ff4400', sk3.particleCount, sk3.particleSpeed, sk3.particleSize);
      game.shakeScreen(sk3.shake);
      game.flashScreen('#ff6400', sk3.flashDuration);
    }

    if (idx === 1) {
      const sk1 = HERO_COMBAT_CONFIG.skillCast.skill1;
      game.addParticles(this.x, this.y, '#88ccff', sk1.particleCount, sk1.particleSpeed);
      game.shakeScreen(sk1.shake);
    }
  }

  dodge(game) {
    if (this.dodging || this.dodgeCd > 0 || this.dead) return;
    const cfg = HERO_COMBAT_CONFIG.dodge;
    const isMecha = this.skin === 'mecha';
    this.dodging = true;
    this.dodgeTimer = isMecha ? cfg.durationMecha : cfg.durationClassic;
    this.dodgeCd = isMecha ? cfg.cooldownMecha : cfg.cooldownClassic;
    this.dodgeDir = this.dir;
    this.dodgeSpeed = isMecha ? cfg.speedMecha : cfg.speedClassic;
    this.invulnTimer = this.dodgeTimer + cfg.invulnExtra;
    game.addParticles(this.x, this.y, '#aaccff', cfg.particleCount, cfg.particleSpeed);
  }

  takeDamage(dmg, game = null) {
    if (this.invulnTimer > 0 || this.dead) return;
    let actual = Math.max(1, dmg - this.def);

    // 许褚被动：概率减免伤害
    if (this.heroId === 'xuzhu') {
      const cfg = HERO_COMBAT_CONFIG.passives.xuzhu;
      if (Math.random() < cfg.blockChance) {
        actual = Math.max(1, Math.floor(actual * cfg.blockDamageMult));
        if (game && game.effectManager) {
          game.effectManager.addText(this.x, this.y - this.radius - 55, '格挡!', '#44ff44', 16, '#000');
        }
      }
    }

    this.hp -= actual;
    this.invulnTimer = 0.5;
    this.hurtTimer = 0.4;

    if (game && game.effectManager) {
      game.effectManager.addText(this.x, this.y - this.radius - 40, `-${actual}`, '#ff4444', 18, '#000');
      game.effectManager.addParticles(this.x, this.y, '#ff4444', 6, 60, 2);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
  }

  getDamageMult(target = null) {
    let mult = 1;

    // 赵云被动：低血量增伤
    if (this.heroId === 'zhaoyun') {
      const cfg = HERO_COMBAT_CONFIG.passives.zhaoyun;
      if (this.hp <= this.maxHpTotal * cfg.hpThreshold) {
        mult *= cfg.damageMult;
      }
    }

    // 吕布被动：对 Boss 增伤
    if (this.heroId === 'lubu' && target) {
      if (BOSS_TYPES.includes(target.type)) {
        mult *= HERO_COMBAT_CONFIG.passives.lubu.bossDamageMult;
      }
    }

    return mult;
  }

  onKill(enemy, game) {
    // 典韦被动：击杀回血
    if (this.heroId === 'dianwei') {
      const cfg = HERO_COMBAT_CONFIG.passives.dianwei;
      const heal = Math.floor(this.maxHpTotal * cfg.killHealRatio);
      this.hp = Math.min(this.maxHpTotal, this.hp + heal);
      if (game && game.effectManager) {
        game.effectManager.addText(this.x, this.y - this.radius - 50, `+${heal}`, '#44ff44', 16, '#000');
      }
    }
  }

  applyPassives(dt, game) {
    // 貂蝉被动：定时魅惑附近敌人
    if (this.heroId === 'diaochan') {
      const cfg = HERO_COMBAT_CONFIG.passives.diaochan;
      this._charmTimer = (this._charmTimer || 0) - dt;
      if (this._charmTimer <= 0) {
        this._charmTimer = cfg.charmInterval;
        let charmed = 0;
        for (const e of game.enemies) {
          if (e.dead || e.charmed) continue;
          const dist = Math.hypot(e.x - this.x, e.y - this.y);
          if (dist < cfg.charmRange) {
            e.applyCharm(cfg.charmDuration);
            charmed++;
          }
        }
        if (charmed > 0 && game.effectManager) {
          game.effectManager.addText(this.x, this.y - this.radius - 60, `魅惑 ×${charmed}`, '#ff69b4', 18, '#000');
          game.effectManager.addParticles(this.x, this.y, '#ff69b4', 10, 80, 4);
        }
      }
    }
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
  }
}
