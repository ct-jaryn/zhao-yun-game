import { MAP_W, MAP_H, SKILLS, EQUIP_TYPES, QUALITY, ZHAO_YUN_EQUIP_TIERS } from '../../config/index.js';
import { vnorm, vec, vdist, angleDiff, pick } from '../utils/index.js';
import { AssetLoader } from '../plugins/AssetLoader.js';

export function getEquipTier(level) {
  const weights = [
    Math.max(0.10, 0.60 - level * 0.03),
    Math.min(0.45, 0.25 + level * 0.01),
    Math.min(0.35, 0.08 + level * 0.015),
    Math.min(0.30, 0.04 + level * 0.015),
    Math.min(0.45, 0.01 + level * 0.02)
  ];
  const total = weights.reduce((a, b) => a + b, 0);
  const roll = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) return i;
  }
  return 0;
}

export function genEquip(level) {
  const type = pick(EQUIP_TYPES);
  const tier = getEquipTier(level);
  const tierData = ZHAO_YUN_EQUIP_TIERS[tier][type];

  const qRoll = Math.random();
  let qi = 0;
  const goldRate = Math.min(0.25, 0.02 + level * 0.008);
  const purpleRate = Math.min(0.45, 0.08 + level * 0.015);
  const blueRate = Math.min(0.7, 0.25 + level * 0.02);
  const greenRate = Math.min(0.9, 0.55 + level * 0.015);
  if (qRoll < goldRate) qi = 4;
  else if (qRoll < purpleRate) qi = 3;
  else if (qRoll < blueRate) qi = 2;
  else if (qRoll < greenRate) qi = 1;
  const q = QUALITY[qi];

  const stats = {};
  for (const [k, v] of Object.entries(tierData.stats)) {
    stats[k] = Math.floor(v * q.mult * (0.85 + Math.random() * 0.3));
  }
  return { type, name: tierData.name, quality: q, stats, level, tier };
}

export function createInitialEquip() {
  const equip = {};
  const tierData = ZHAO_YUN_EQUIP_TIERS[0];
  for (const type of EQUIP_TYPES) {
    const stats = {};
    for (const [k, v] of Object.entries(tierData[type].stats)) {
      stats[k] = Math.floor(v * QUALITY[0].mult);
    }
    equip[type] = { type, name: tierData[type].name, quality: QUALITY[0], stats, level: 1, tier: 0 };
  }
  return equip;
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
  constructor(scene, x, y, skin = 'classic') {
    this.scene = scene;
    this.skin = skin;
    this.x = x;
    this.y = y;
    this.dir = 0;
    this.speed = 200;
    this.radius = 36;

    this.level = 1;
    this.exp = 0;
    this.expToLevel = 100;
    this.maxHp = 150;
    this.hp = 150;
    this.maxMp = 80;
    this.mp = 80;
    this.baseAtk = 20;
    this.baseDef = 8;
    this.critRate = 5;
    this.mpRegen = 3;

    this.equip = createInitialEquip();
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
    this.hpRegen = 1;
    this.bonusHpRegen = 0;
    this.bonusMpRegen = 0;

    this.moving = false;
    this.mouseAim = false;

    this.animPrefix = skin === 'mecha' ? 'mecha_player' : 'player';
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

  addExp(v, game) {
    this.exp += v;
    while (this.exp >= this.expToLevel) {
      this.exp -= this.expToLevel;
      this.level++;
      this.expToLevel = Math.floor(this.expToLevel * 1.25);
      this.hp = this.maxHpTotal;
      this.mp = this.maxMpTotal;
      this.baseAtk += 3;
      this.baseDef += 2;
      game.addText(this.x, this.y - 50, `升级! Lv.${this.level}`, '#ffd700', 26, '#000');
      game.addParticles(this.x, this.y, '#ffd700', 25, 120);
      game.shakeScreen(4);
      game.flashScreen('#ffd700', 0.2);
      game.showLevelUp();
    }
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
    const targetH = this.skin === 'mecha' ? 270 : 210;
    const scale = targetH / source.height;
    this.sprite.setScale(scale);
  }

  update(dt, input, game) {
    this.hp = Math.min(this.maxHpTotal, this.hp + this.hpRegen * (1 + this.bonusHpRegen) * dt);
    this.mp = Math.min(this.maxMpTotal, this.mp + this.mpRegen * (1 + this.bonusMpRegen) * dt);
    for (let i = 0; i < 5; i++) {
      if (this.skillCd[i] > 0) this.skillCd[i] -= dt;
    }
    if (this.dodgeCd > 0) this.dodgeCd -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    if (this.dead) {
      this.syncSprite();
      return;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        if (this.combo >= 5) game.addText(this.x, this.y - 70, '连击中断!', '#888', 16, '#000');
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
  }

  syncSprite() {
    this.sprite.setPosition(this.x, this.y);
    this.updateFlip();

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
        game.addParticles(this.x - Math.cos(this.dir) * 90 * t, this.y - Math.sin(this.dir) * 90 * t, '#ff8844', 1, 40, 4);
      }
    }

    const hits = [];
    for (const e of game.enemies) {
      if (e.dead) continue;
      const dist = vdist(vec(this.x, this.y), vec(e.x, e.y));
      if (dist > sk.range + e.radius + this.radius) continue;
      const angleTo = Math.atan2(e.y - this.y, e.x - this.x);
      if (Math.abs(angleDiff(angleTo, this.dir)) <= sk.arc / 2) hits.push(e);
    }

    for (const e of hits) {
      game.hitEnemyWithSkill(e, idx);
    }

    if (idx === 0) {
      this.showAttackArc(sk.range + this.radius, sk.arc);
    }

    if (idx === 4) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        game.addProjectile(this.x, this.y, a, 350, this.atk * 0.5, 'player', '#ffd700', 5, 1.5, null, true);
      }
      game.addParticles(this.x, this.y, '#ffd700', 35, 160);
      game.shakeScreen(8);
      game.flashScreen('#ffd700', 0.25);
    }

    if (idx === 3) {
      game.addParticles(this.x, this.y, '#ff4400', 50, 80, 5);
      game.shakeScreen(5);
      game.flashScreen('#ff6400', 0.2);
    }

    if (idx === 1) {
      game.addParticles(this.x, this.y, '#88ccff', 18, 90);
      game.shakeScreen(3);
    }
  }

  dodge(game) {
    if (this.dodging || this.dodgeCd > 0 || this.dead) return;
    const isMecha = this.skin === 'mecha';
    this.dodging = true;
    this.dodgeTimer = isMecha ? 0.45 : 0.25;
    this.dodgeCd = isMecha ? 1.0 : 0.8;
    this.dodgeDir = this.dir;
    this.dodgeSpeed = isMecha ? 500 : 400;
    this.invulnTimer = this.dodgeTimer + 0.15;
    game.addParticles(this.x, this.y, '#aaccff', 10, 70);
  }

  takeDamage(dmg, game = null) {
    if (this.invulnTimer > 0 || this.dead) return;
    const actual = Math.max(1, dmg - this.def);
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

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
