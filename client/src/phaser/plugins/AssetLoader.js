const SLICE_DIRS = ['front', 'front_right', 'right', 'back_right', 'back', 'back_left', 'left', 'front_left'];

function padNumber(num, pad) {
  return String(num).padStart(pad, '0');
}

function sliceKey(prefix, dir) {
  return `${prefix}_${dir}`;
}

function frameKey(prefix, idx) {
  return `${prefix}_${idx}`;
}

export class AssetLoader {
  constructor(scene) {
    this.scene = scene;
  }

  loadSliceSet(prefix, basePath, ext = 'png') {
    for (const dir of SLICE_DIRS) {
      const key = sliceKey(prefix, dir);
      this.scene.load.image(key, `${basePath}/${dir}.${ext}`);
    }
  }

  loadFrameSet(prefix, basePath, count, ext = 'png', pad = 3) {
    for (let i = 1; i <= count; i++) {
      const key = frameKey(prefix, i - 1);
      this.scene.load.image(key, `${basePath}${padNumber(i, pad)}.${ext}`);
    }
  }

  loadSkillFrames(prefix, skillKey, basePath, count, ext = 'png', pad = 3) {
    for (let i = 1; i <= count; i++) {
      const key = frameKey(`${prefix}_skill_${skillKey}`, i - 1);
      this.scene.load.image(key, `${basePath}${padNumber(i, pad)}.${ext}`);
    }
  }

  loadAllPlayerAssets() {
    // 8方向切片
    this.loadSliceSet('player', 'slices_png', 'png');
    this.loadSliceSet('mecha_player', 'player_mecha/slices', 'webp');

    // 技能帧
    this.loadSkillFrames('player', 0, 'attack/frames_png/frame_', 4, 'png', 3);
    this.loadSkillFrames('player', 1, 'whirlwind/frames_png/frame_', 4, 'png', 3);
    this.loadSkillFrames('player', 2, 'player_dash/frames/frame_', 6, 'webp', 3);
    this.loadSkillFrames('mecha_player', 0, 'player_mecha/attack/frame_', 6, 'webp', 3);
    this.loadSkillFrames('mecha_player', 1, 'player_mecha/skill/frame_', 6, 'webp', 3);
    this.loadSkillFrames('mecha_player', 2, 'player_mecha/skill/frame_', 6, 'webp', 3);

    // 其他动作帧
    this.loadFrameSet('player_dodge', 'dodge/frames_png/frame_', 4, 'png', 3);
    this.loadFrameSet('player_hurt', 'hurt/frames_png/frame_', 4, 'png', 3);
    this.loadFrameSet('player_death', 'death/frames_png/frame_', 4, 'png', 3);
    this.loadFrameSet('player_ultimate', 'player_ultimate/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('player_walk', 'player_walk/frames_png/frame_', 6, 'png', 3);

    this.loadFrameSet('mecha_player_dodge', 'player_mecha/dodge/frame_', 6, 'webp', 3);
    this.loadFrameSet('mecha_player_ultimate', 'player_mecha/ultimate/frame_', 6, 'webp', 3);
    this.loadFrameSet('mecha_player_walk', 'player_mecha/walk/frame_', 6, 'webp', 3);
    this.loadFrameSet('mecha_player_death', 'player_mecha/death/frame_', 6, 'webp', 3);
    this.loadFrameSet('mecha_player_hurt', 'player_mecha/hurt/frame_', 6, 'webp', 3);

    // skill_3（烽火燎原）专属帧
    this.loadFrameSet('player_skill_3', 'player_skill3/classic_frame_', 4, 'png', 3);
    this.loadFrameSet('mecha_player_skill_3', 'player_skill3/mecha_frame_', 4, 'png', 3);

    // 机甲头像和技能图标
    this.scene.load.image('mecha_avatar', 'player_mecha/avatar.png');
    for (let i = 0; i < 5; i++) {
      this.scene.load.image(`mecha_skill_icon_${i}`, `player_mecha/skill_icons/skill_${['normal', 'whirlwind', 'dash', 'fire', 'ultimate'][i]}.png`);
    }
  }

  loadEnemyAssets() {
    // 枪兵
    this.loadSliceSet('spearman', 'enemy_spearman/slices_png', 'png');
    this.loadFrameSet('spearman_walk_right', 'enemy_spearman/walk_right_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('spearman_walk_down', 'enemy_spearman/walk_down_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('spearman_walk_up', 'enemy_spearman/walk_up_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('spearman_attack', 'enemy_spearman/attack_frames/frames/frame_', 6, 'webp', 3);

    // 曹将 / Boss
    this.loadSliceSet('general', 'enemy_general/slices_png', 'png');
    this.loadFrameSet('general_attack', 'enemy_general/attack_frames_png/frame_', 6, 'png', 3);
    this.loadFrameSet('general_ultimate', 'enemy_general/skill_ultimate_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('general_walk_right', 'enemy_general/walk_right_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('general_walk_down', 'enemy_general/walk_down_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('general_walk_up', 'enemy_general/walk_up_frames/frames/frame_', 6, 'webp', 3);

    // 吕布
    this.loadSliceSet('lubu', 'enemy_lubu/slices_png', 'webp');
    this.loadFrameSet('lubu_walk', 'enemy_lubu/walk_left_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('lubu_attack', 'enemy_lubu/attack_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('lubu_skill', 'enemy_lubu/skill_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('lubu_ultimate', 'enemy_lubu/skill_ultimate_frames/frames/frame_', 6, 'webp', 3);

    // 典韦
    this.loadSliceSet('dianwei', 'enemy_dianwei/slices_png', 'webp');
    this.loadFrameSet('dianwei_walk', 'enemy_dianwei/walk_left_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('dianwei_attack', 'enemy_dianwei/attack_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('dianwei_ultimate', 'enemy_dianwei/skill_frames/frames/frame_', 6, 'webp', 3);

    // 许褚
    this.loadSliceSet('xuzhu', 'enemy_xuzhu/slices_png', 'webp');
    this.loadFrameSet('xuzhu_walk', 'enemy_xuzhu/walk_left_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('xuzhu_attack', 'enemy_xuzhu/attack_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('xuzhu_skill', 'enemy_xuzhu/skill_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('xuzhu_ultimate', 'enemy_xuzhu/skill_ultimate_frames/frames/frame_', 6, 'webp', 3);

    // 骑兵
    this.loadSliceSet('cavalry', 'enemy_cavalry/slices_png', 'webp');
    this.loadFrameSet('cavalry_walk', 'enemy_cavalry/walk_left_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('cavalry_attack', 'enemy_cavalry/attack_frames/frames/frame_', 6, 'webp', 3);

    // 弓箭手
    this.loadSliceSet('archer', 'enemy_archer/slices_png', 'webp');
    this.loadFrameSet('archer_walk', 'enemy_archer/walk_left_frames/frames/frame_', 6, 'webp', 3);
    this.loadFrameSet('archer_attack', 'enemy_archer/attack_frames/frames/frame_', 6, 'webp', 3);
  }

  loadDiaoChanAssets() {
    this.loadSliceSet('diaochan', 'diaochan/slices', 'webp');
    this.loadFrameSet('diaochan_tied', 'diaochan_tied/frames/frame_', 6, 'webp', 3);
  }

  loadChapterBackgrounds() {
    this.scene.load.image('bg_chapter_1', 'generated/background.png');
    this.scene.load.image('bg_chapter_2', 'generated/bg_chapter2.png');
    this.scene.load.image('bg_chapter_3', 'generated/bg_chapter3.png');
    this.scene.load.image('bg_chapter_4', 'generated/bg_chapter4.png');
  }

  loadCommonAssets() {
    this.scene.load.image('arrow', 'generated/arrow.png');
    this.scene.load.image('avatar', 'generated/avatar.png');
    for (let i = 0; i < 5; i++) {
      this.scene.load.image(`equip_weapon_${i}`, `equipment/weapon_${i}.png`);
      this.scene.load.image(`equip_armor_${i}`, `equipment/armor_${i}.png`);
      this.scene.load.image(`equip_helmet_${i}`, `equipment/helmet_${i}.png`);
      this.scene.load.image(`equip_boots_${i}`, `equipment/boots_${i}.png`);
      this.scene.load.image(`equip_accessory_${i}`, `equipment/accessory_${i}.png`);
    }
  }

  loadEffectAssets() {
    this.scene.load.image('projectile_arrow', 'generated_effects/projectile_arrow.png');
    this.scene.load.image('projectile_spear', 'generated_effects/projectile_spear.png');
    this.scene.load.image('particle_spark', 'generated_effects/particle_spark.png');
    this.scene.load.image('particle_smoke', 'generated_effects/particle_smoke.png');
    this.scene.load.image('particle_blood', 'generated_effects/particle_blood.png');
    this.scene.load.image('particle_gold', 'generated_effects/particle_gold.png');
    this.scene.load.image('drop_chest', 'generated_effects/drop_chest.png');
    this.scene.load.image('hint_arrow', 'generated_effects/hint_arrow.png');
    this.scene.load.image('minimap_player', 'generated_effects/minimap_player.png');
    this.scene.load.image('minimap_boss', 'generated_effects/minimap_boss.png');
    this.scene.load.image('minimap_drop', 'generated_effects/minimap_drop.png');
  }

  loadAll() {
    this.loadAllPlayerAssets();
    this.loadEnemyAssets();
    this.loadDiaoChanAssets();
    this.loadChapterBackgrounds();
    this.loadCommonAssets();
    this.loadEffectAssets();
  }

  // 静态工具方法：根据方向解析切片 key
  static resolveSliceDir(dir) {
    let a = dir;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;

    const step = Math.PI / 4;
    const idx = Math.round(a / step);
    const map = {
      0: 'right',
      1: 'front_right',
      2: 'front',
      3: 'front_left',
      4: 'left',
      '-4': 'left',
      '-3': 'back_left',
      '-2': 'back',
      '-1': 'back_right'
    };
    return map[idx] || 'front';
  }

  static resolveWalkDir4(dir) {
    let a = dir;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;

    if (a >= -Math.PI / 4 && a < Math.PI / 4) return 'right';
    if (a >= Math.PI / 4 && a < 3 * Math.PI / 4) return 'down';
    if (a >= 3 * Math.PI / 4 || a < -3 * Math.PI / 4) return 'right'; // left 通过 right + flipX 表现
    return 'up';
  }

  static getPlayerSliceKey(skin, dir) {
    const prefix = skin === 'mecha' ? 'mecha_player' : 'player';
    return `${prefix}_${this.resolveSliceDir(dir)}`;
  }

  static getEnemySliceKey(type, dir) {
    return `${type}_${this.resolveSliceDir(dir)}`;
  }

  static getFrameKey(prefix, frameIndex) {
    return `${prefix}_${frameIndex}`;
  }

  static hasTexture(scene, key) {
    return scene.textures && scene.textures.exists(key);
  }

  static getFailedKeys(scene) {
    return scene.game.registry.get('failedAssetKeys') || [];
  }
}
