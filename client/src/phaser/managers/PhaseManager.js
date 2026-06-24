import { MAP_W, MAP_H } from '../utils/index.js';
import { vdist, vec } from '../utils/index.js';
import { DiaoChan } from '../entities/DiaoChan.js';
import { DIAOCHAN_AVATAR } from '../../config/index.js';

export class PhaseManager {
  constructor(game) {
    this.game = game;
    this.chapterConfig = game.chapterConfig;

    this.phase = 'soldiers';
    this.soldierKills = 0;
    this.soldiersRequired = 20;
    this.midBossDefeated = false;
    this.finalBoss1Defeated = false;
    this.finalBoss2Defeated = false;

    this.diaochan = null;
    this.diaochanApproached = false;
    this.diaochanRescued = false;
    this.rescueWinTimer = 0;

    if (game.chapter === 1) {
      this.diaochan = new DiaoChan(game.scene, MAP_W - 350, MAP_H / 2);
    }
  }

  startLevel() {
    const game = this.game;
    const cfg = this.chapterConfig;

    if (this.phase === 'caocao') this.spawnBoss();
    else if (this.phase === 'final') this.spawnFinalBosses();
    else game.effectManager.showWaveAnnounce(0, `${cfg.name} · ${cfg.subtitle}`);
  }

  spawnBoss() {
    const game = this.game;
    const cfg = this.chapterConfig;
    this.phase = 'caocao';
    const pos = game.spawnManager.randomBossSpawnPos();
    const boss = game.spawnManager.createEnemy(cfg.bossType, pos.x, pos.y, { skipRevive: true });
    game.enemies.push(boss);

    game.effectManager.showWaveAnnounce(0, `⚠ ${cfg.bossName} 来袭!`);
    game.effectManager.addKillLog(`${cfg.bossName}出现！`);
    game.effectManager.addText(game.player.x, game.player.y - 80, `${cfg.bossName}出现！`, '#ff44ff', 24, '#000');
    game.effectManager.shakeScreen(6);
  }

  spawnFinalBosses() {
    const game = this.game;
    const cfg = this.chapterConfig;
    this.phase = 'final';
    const names = cfg.finalBosses.map(b => b.name).join(' & ');
    for (const bossCfg of cfg.finalBosses) {
      const pos = game.spawnManager.randomBossSpawnPos();
      const boss = game.spawnManager.createEnemy(bossCfg.type, pos.x, pos.y, { enhanced: bossCfg.enhanced || false, skipRevive: true });
      game.enemies.push(boss);
    }

    game.effectManager.showWaveAnnounce(0, `⚠ ${names} 同时来袭!`);
    game.effectManager.addKillLog(`${names}同时降临！`);
    game.effectManager.addText(game.player.x, game.player.y - 90, `${names}同时降临！`, '#ff0000', 28, '#000');
    game.effectManager.shakeScreen(10);
    game.effectManager.flashScreen('#ff0000', 0.6);
    game.effectManager.addParticles(game.player.x, game.player.y, '#ff44ff', 50, 200);
  }

  rescueDiaoChan() {
    if (!this.diaochan || this.diaochanRescued) return;
    const game = this.game;
    this.diaochan.rescue(game);
    this.diaochanRescued = true;
    game.effectManager.addText(this.diaochan.x, this.diaochan.y - 80, '貂蝉已获救！', '#ff69b4', 28, '#000');
    game.effectManager.addKillLog('貂蝉成功获救！');
    game.effectManager.showWaveAnnounce(0, '貂蝉已获救 · 通关在即');
    this.rescueWinTimer = 4.0;
  }

  checkFinalVictory() {
    if (this.finalBoss1Defeated && this.finalBoss2Defeated) {
      this.game.gameWin();
    }
  }

  getPhaseName() {
    const cfg = this.chapterConfig;
    const names = {
      soldiers: '清兵阶段',
      caocao: cfg.bossName || '中Boss',
      final: cfg.finalBosses.map(b => b.name).join(' & ') || '双Boss',
      victory: '通关'
    };
    return names[this.phase] || this.phase;
  }

  updateRescueWinTimer(dt) {
    if (this.rescueWinTimer > 0) {
      this.rescueWinTimer -= dt;
      if (this.rescueWinTimer <= 0) this.game.gameWin();
      return true;
    }
    return false;
  }

  updateDiaoChanApproach() {
    const game = this.game;
    if (!this.diaochan || this.diaochan.state !== 'captive' || this.diaochanApproached) return false;
    const dist = vdist(vec(game.player.x, game.player.y), vec(this.diaochan.x, this.diaochan.y));
    if (dist < 150) {
      this.diaochanApproached = true;
      game.addPause('dialogue');
      if (game.uiSync && game.uiSync.showDialogue) {
        game.uiSync.showDialogue('貂蝉', '将军！妾身被吕布囚于此地，求将军击败吕布，救我出去……', {
          portrait: DIAOCHAN_AVATAR,
          onClose: () => { game.removePause('dialogue'); }
        });
      } else {
        game.removePause('dialogue');
      }
      return true;
    }
    return false;
  }

  update(dt) {
    if (this.diaochan) this.diaochan.update(dt, this.game);
    if (this.updateRescueWinTimer(dt)) return;
    this.updateDiaoChanApproach();
  }
}
