import { AssetLoader } from './AssetLoader.js';

function framesFor(scene, prefix, count) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const key = AssetLoader.getFrameKey(prefix, i);
    if (scene.textures.exists(key)) {
      frames.push({ key });
    }
  }
  return frames;
}

function createAnim(scene, key, prefix, count, frameRate = 12, repeat = 0) {
  const frames = framesFor(scene, prefix, count);
  if (frames.length === 0) return;
  if (scene.anims.exists(key)) scene.anims.remove(key);
  scene.anims.create({
    key,
    frames,
    frameRate,
    repeat
  });
}

function createSliceAnim(scene, key, prefix, frameRate = 8, repeat = -1) {
  const frames = [];
  for (const dir of ['front', 'front_right', 'right', 'back_right', 'back', 'back_left', 'left', 'front_left']) {
    const k = `${prefix}_${dir}`;
    if (scene.textures.exists(k)) {
      frames.push({ key: k });
    }
  }
  if (frames.length === 0) return;
  if (scene.anims.exists(key)) scene.anims.remove(key);
  scene.anims.create({
    key,
    frames,
    frameRate,
    repeat
  });
}

export class AnimationFactory {
  static createPlayerAnimations(scene, skin = 'classic') {
    const prefix = skin === 'mecha' ? 'mecha_player' : 'player';

    createAnim(scene, `${prefix}_walk`, `${prefix}_walk`, 6, 12, -1);
    createAnim(scene, `${prefix}_dodge`, `${prefix}_dodge`, skin === 'mecha' ? 6 : 4, 16, 0);
    createAnim(scene, `${prefix}_hurt`, `${prefix}_hurt`, skin === 'mecha' ? 6 : 4, 12, 0);
    createAnim(scene, `${prefix}_death`, `${prefix}_death`, skin === 'mecha' ? 6 : 4, 8, 0);
    createAnim(scene, `${prefix}_ultimate`, `${prefix}_ultimate`, 6, 12, 0);

    for (let i = 0; i < 3; i++) {
      createAnim(scene, `${prefix}_skill_${i}`, `${prefix}_skill_${i}`, skin === 'mecha' ? 6 : 4, 16, 0);
    }

    // skill_3（烽火燎原）专属施法帧
    const skill3Frames = framesFor(scene, `${prefix}_skill_3`, 4);
    if (skill3Frames.length > 0) {
      const skill3Key = `${prefix}_skill_3`;
      if (scene.anims.exists(skill3Key)) scene.anims.remove(skill3Key);
      scene.anims.create({
        key: skill3Key,
        frames: skill3Frames,
        frameRate: 12,
        repeat: 0
      });
    } else {
      //  fallback：复用 ultimate 帧
      const ultimateFrames = framesFor(scene, `${prefix}_ultimate`, 6);
      if (ultimateFrames.length > 0) {
        const skill3Key = `${prefix}_skill_3`;
        if (scene.anims.exists(skill3Key)) scene.anims.remove(skill3Key);
        scene.anims.create({
          key: skill3Key,
          frames: ultimateFrames,
          frameRate: 14,
          repeat: 0
        });
      }
    }
  }

  static createEnemyAnimations(scene, type) {
    const anims = {
      spearman: [
        ['spearman_walk_right', 'spearman_walk_right', 6, 12, -1],
        ['spearman_walk_down', 'spearman_walk_down', 6, 12, -1],
        ['spearman_walk_up', 'spearman_walk_up', 6, 12, -1],
        ['spearman_attack', 'spearman_attack', 6, 12, 0]
      ],
      general: [
        ['general_attack', 'general_attack', 6, 12, 0],
        ['general_ultimate', 'general_ultimate', 6, 12, 0],
        ['general_walk_right', 'general_walk_right', 6, 12, -1],
        ['general_walk_down', 'general_walk_down', 6, 12, -1],
        ['general_walk_up', 'general_walk_up', 6, 12, -1]
      ],
      lubu: [
        ['lubu_walk', 'lubu_walk', 6, 12, -1],
        ['lubu_attack', 'lubu_attack', 6, 12, 0],
        ['lubu_skill', 'lubu_skill', 6, 12, 0],
        ['lubu_ultimate', 'lubu_ultimate', 6, 12, 0]
      ],
      dianwei: [
        ['dianwei_walk', 'dianwei_walk', 6, 12, -1],
        ['dianwei_attack', 'dianwei_attack', 6, 12, 0],
        ['dianwei_ultimate', 'dianwei_ultimate', 6, 12, 0]
      ],
      xuzhu: [
        ['xuzhu_walk', 'xuzhu_walk', 6, 12, -1],
        ['xuzhu_attack', 'xuzhu_attack', 6, 12, 0],
        ['xuzhu_skill', 'xuzhu_skill', 6, 12, 0],
        ['xuzhu_ultimate', 'xuzhu_ultimate', 6, 12, 0]
      ],
      cavalry: [
        ['cavalry_walk', 'cavalry_walk', 6, 12, -1],
        ['cavalry_attack', 'cavalry_attack', 6, 12, 0]
      ],
      archer: [
        ['archer_walk', 'archer_walk', 6, 12, -1],
        ['archer_attack', 'archer_attack', 6, 12, 0]
      ]
    };

    const list = anims[type];
    if (!list) return;
    for (const [key, prefix, count, fps, repeat] of list) {
      createAnim(scene, key, prefix, count, fps, repeat);
    }
  }

  static createAllAnimations(scene) {
    this.createPlayerAnimations(scene, 'classic');
    this.createPlayerAnimations(scene, 'mecha');

    const enemyTypes = ['spearman', 'general', 'lubu', 'dianwei', 'xuzhu', 'cavalry', 'archer'];
    for (const type of enemyTypes) {
      this.createEnemyAnimations(scene, type);
    }

    createAnim(scene, 'diaochan_tied', 'diaochan_tied', 6, 8, -1);
  }
}
