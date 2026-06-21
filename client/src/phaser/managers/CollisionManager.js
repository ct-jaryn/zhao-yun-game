import { vdist, vec } from '../utils/index.js';

export class CollisionManager {
  constructor(game) {
    this.game = game;
  }

  update(dt) {
    const game = this.game;
    const player = game.player;

    for (const p of game.projectiles) {
      if (p.owner === 'player') {
        for (const e of game.enemies) {
          if (e.dead || p.hit.has(e)) continue;
          if (vdist(vec(p.x, p.y), vec(e.x, e.y)) < e.radius + p.size) {
            e.takeDamage(p.dmg, false, p.dir, game);
            p.hit.add(e);
            if (!p.pierce) {
              p.life = 0;
              p.destroy();
              break;
            }
          }
        }
      } else if (p.owner === 'enemy') {
        if (!player.dead && vdist(vec(p.x, p.y), vec(player.x, player.y)) < player.radius + p.size) {
          player.takeDamage(p.dmg, game);
          p.life = 0;
          p.destroy();
        }
      }
    }

    game.projectiles = game.projectiles.filter(p => p.life > 0 && p.sprite && p.sprite.active);
  }
}
