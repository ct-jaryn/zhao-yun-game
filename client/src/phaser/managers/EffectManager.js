import { rand, randInt, pick } from '../utils/index.js';
import { Particle } from '../entities/Particle.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { SaveManager } from '../../save/SaveManager.js';

export class EffectManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.particles = [];
    this.texts = [];
    this.killLog = [];
    this.lastKillMilestone = 0;

    this.particlePool = new ObjectPool(
      () => new Particle(this.scene),
      (p, scene, x, y, vx, vy, color, life, size, imgKey) => p.reset(scene, x, y, vx, vy, color, life, size, imgKey),
      20
    );
  }

  shakeScreen(intensity) {
    try {
      const save = SaveManager.getInstance();
      if (save && save.settings && save.settings.screenShake === false) return;
    } catch (e) {}
    this.scene.cameras.main.shake(200 + intensity * 30, intensity / 100);
  }

  flashScreen(color, duration = 0.15) {
    const hex = typeof color === 'string' && color.startsWith('#')
      ? parseInt(color.replace('#', '0x'), 16)
      : 0xffffff;
    this.scene.cameras.main.flash(300 + duration * 500, hex);
  }

  addParticles(x, y, color, count, speed, size) {
    const imgKey = this.particleTextureForColor(color);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(speed * 0.3, speed);
      const sz = size || rand(2, 5);
      const p = this.particlePool.acquire(this.scene, x, y, Math.cos(a) * s, Math.sin(a) * s, color, rand(0.3, 0.8), sz, imgKey);
      this.particles.push(p);
    }
  }

  particleTextureForColor(color) {
    if (color === '#ffd700' || color === '#ffaa00' || color === '#ffcc44' || color === '#fff5c8') return 'particle_gold';
    if (color === '#ff4444' || color === '#ff6644' || color === '#ff4422' || color === '#ff0000') return 'particle_blood';
    if (color === '#ff8800' || color === '#ff4400' || color === '#ff8844' || color === '#ff6400') return 'particle_spark';
    if (color === '#aaccff' || color === '#88ccff' || color === '#ffffff') return null; // 冷色用纯色方块
    if (color === '#ff69b4' || color === '#ff44ff' || color === '#960096') return null;
    return 'particle_smoke';
  }

  addText(x, y, text, color = '#ffffff', size = 16, outline = '#000000') {
    const style = {
      fontFamily: 'Noto Serif SC',
      fontSize: `${size}px`,
      color,
      stroke: outline,
      strokeThickness: 3,
      align: 'center'
    };
    const t = this.scene.add.text(x, y, text, style).setOrigin(0.5);
    t.setDepth(30);

    this.texts.push({
      sprite: t,
      life: 1.0,
      vy: -40,
      update(dt) {
        this.life -= dt;
        t.y += this.vy * dt;
        t.setAlpha(Math.max(0, this.life));
        return this.life > 0;
      },
      destroy() {
        t.destroy();
      }
    });
  }

  addKillLog(text) {
    this.killLog.unshift({ text, time: 4 });
    if (this.killLog.length > 6) this.killLog.pop();
  }

  showWaveAnnounce(num, sub) {
    const el = document.getElementById('waveAnnounce');
    if (!el) return;
    document.getElementById('waNum').textContent = num > 0 ? `第 ${num} 波` : '关卡进度';
    document.getElementById('waSub').textContent = sub || '';
    el.style.display = 'block';
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'waveAnnounce 2.5s ease forwards';
    setTimeout(() => el.style.display = 'none', 2500);
  }

  checkKillMilestone() {
    const milestone = Math.floor(this.game.totalKills / 100) * 100;
    if (milestone > 0 && milestone > this.lastKillMilestone) {
      this.lastKillMilestone = milestone;
      this.showKillMilestone(milestone);
    }
  }

  showKillMilestone(kills) {
    const titles = {
      100: '一骑当千', 200: '锐不可当', 300: '所向披靡', 400: '横扫千军',
      500: '万人敌', 600: '神勇无双', 700: '霸气纵横', 800: '修罗降世',
      900: '九天揽月', 1000: '千古传奇'
    };
    const title = titles[kills] || (kills >= 1000 ? '传说再临' : '勇冠三军');
    const el = document.getElementById('killMilestone');
    if (el) {
      document.getElementById('kmText').textContent = `${kills}斩`;
      document.getElementById('kmSub').textContent = title;
      this.shakeScreen(16);
      this.flashScreen('#ffaa00', 0.55);
      el.style.display = 'block';
      el.classList.remove('active');
      void el.offsetWidth;
      el.classList.add('active');
      setTimeout(() => {
        el.classList.remove('active');
        el.style.display = 'none';
      }, 2400);
    }

    const p = this.game.player;
    const colors = ['#ffd700', '#ff4422', '#ffaa44', '#ff6644', '#fff5c8'];
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(120, 320);
      const particle = this.particlePool.acquire(this.scene, p.x, p.y, Math.cos(a) * s, Math.sin(a) * s, pick(colors), rand(0.6, 1.4), rand(3, 9));
      this.particles.push(particle);
    }
    this.addText(p.x, p.y - 110, `★ ${kills}斩 · ${title} ★`, '#ffd700', 30, '#000');
    this.addKillLog(`★ ${kills}斩 · ${title} ★`);
  }

  update(dt) {
    const aliveParticles = [];
    for (const p of this.particles) {
      if (p.update(dt)) {
        aliveParticles.push(p);
      } else {
        p.deactivate();
        this.particlePool.release(p);
      }
    }
    this.particles = aliveParticles;

    this.texts = this.texts.filter(t => t.update(dt));

    for (const k of this.killLog) k.time -= dt;
    this.killLog = this.killLog.filter(k => k.time > 0);
  }

  shutdown() {
    this.particles.forEach(p => { try { p.destroy(); } catch (e) {} });
    this.particles = [];
    this.particlePool.clear();
    this.texts.forEach(t => { try { t.destroy(); } catch (e) {} });
    this.texts = [];
    this.killLog = [];
  }
}
