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
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, `${basePath}/${dir}.${ext}`);
      }
    }
  }

  loadFrameSet(prefix, basePath, count, ext = 'png', pad = 3) {
    for (let i = 1; i <= count; i++) {
      const key = frameKey(prefix, i - 1);
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, `${basePath}${padNumber(i, pad)}.${ext}`);
      }
    }
  }

  loadSkillFrames(prefix, skillKey, basePath, count, ext = 'png', pad = 3) {
    for (let i = 1; i <= count; i++) {
      const key = frameKey(`${prefix}_skill_${skillKey}`, i - 1);
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, `${basePath}${padNumber(i, pad)}.${ext}`);
      }
    }
  }

  loadPlayerAssets(skin) {
    if (skin === 'mecha') {
      this.loadSliceSet('mecha_player', 'player_mecha/slices', 'webp');

      this.loadSkillFrames('mecha_player', 0, 'player_mecha/attack/frame_', 6, 'webp', 3);
      this.loadSkillFrames('mecha_player', 1, 'player_mecha/skill/frame_', 6, 'webp', 3);
      this.loadSkillFrames('mecha_player', 2, 'player_mecha/skill/frame_', 6, 'webp', 3);

      this.loadFrameSet('mecha_player_dodge', 'player_mecha/dodge/frame_', 6, 'webp', 3);
      this.loadFrameSet('mecha_player_ultimate', 'player_mecha/ultimate/frame_', 6, 'webp', 3);
      this.loadFrameSet('mecha_player_walk', 'player_mecha/walk/frame_', 6, 'webp', 3);
      this.loadFrameSet('mecha_player_death', 'player_mecha/death/frame_', 6, 'webp', 3);
      this.loadFrameSet('mecha_player_hurt', 'player_mecha/hurt/frame_', 6, 'webp', 3);

      this.loadFrameSet('mecha_player_skill_3', 'player_skill3/mecha_frame_', 4, 'png', 3);

      if (!this.scene.textures.exists('mecha_avatar')) {
        this.scene.load.image('mecha_avatar', 'player_mecha/avatar.png');
      }
      for (let i = 0; i < 5; i++) {
        const key = `mecha_skill_icon_${i}`;
        if (!this.scene.textures.exists(key)) {
          this.scene.load.image(key, `player_mecha/skill_icons/skill_${['normal', 'whirlwind', 'dash', 'fire', 'ultimate'][i]}.png`);
        }
      }
    } else {
      this.loadSliceSet('player', 'slices_png', 'png');

      this.loadSkillFrames('player', 0, 'attack/frames_png/frame_', 4, 'png', 3);
      this.loadSkillFrames('player', 1, 'whirlwind/frames_png/frame_', 4, 'png', 3);
      this.loadSkillFrames('player', 2, 'player_dash/frames/frame_', 6, 'webp', 3);

      this.loadFrameSet('player_dodge', 'dodge/frames_png/frame_', 4, 'png', 3);
      this.loadFrameSet('player_hurt', 'hurt/frames_png/frame_', 4, 'png', 3);
      this.loadFrameSet('player_death', 'death/frames_png/frame_', 4, 'png', 3);
      this.loadFrameSet('player_ultimate', 'player_ultimate/frames/frame_', 6, 'webp', 3);
      this.loadFrameSet('player_walk', 'player_walk/frames_png/frame_', 6, 'png', 3);

      this.loadFrameSet('player_skill_3', 'player_skill3/classic_frame_', 4, 'png', 3);
    }
  }

  loadAllPlayerAssets() {
    this.loadPlayerAssets('classic');
    this.loadPlayerAssets('mecha');
  }

  // 章节所需的敌人 sprite 类型（基于 CHAPTER_CONFIG 的 boss/finalBosses + 通用小兵）
  // 小兵 soldier(=spearman)/archer/cavalry 所有章节都需要
  static getChapterEnemyTypes(chapter) {
    const types = new Set(['spearman', 'archer', 'cavalry']);
    const bossMap = { lubu: 'lubu', dianwei: 'dianwei', xuzhu: 'xuzhu', boss: 'general' };
    // 中 Boss
    const cfgBoss = { 1: 'lubu', 2: 'dianwei', 3: 'xuzhu', 4: 'lubu' }[chapter];
    if (cfgBoss && bossMap[cfgBoss]) types.add(bossMap[cfgBoss]);
    // finalBosses：ch2/3/4 含 boss(=general)，ch1/ch4 含 lubu
    if (chapter === 2 || chapter === 3 || chapter === 4) types.add('general');
    if (chapter === 1 || chapter === 4) types.add('lubu');
    if (chapter === 2) types.add('dianwei');
    if (chapter === 3) types.add('xuzhu');
    return types;
  }

  loadEnemyType(type) {
    switch (type) {
      case 'spearman':
        this.loadSliceSet('spearman', 'enemy_spearman/slices_png', 'png');
        this.loadFrameSet('spearman_walk_right', 'enemy_spearman/walk_right_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('spearman_walk_down', 'enemy_spearman/walk_down_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('spearman_walk_up', 'enemy_spearman/walk_up_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('spearman_attack', 'enemy_spearman/attack_frames/frames/frame_', 6, 'webp', 3);
        break;
      case 'general':
        this.loadSliceSet('general', 'enemy_general/slices_png', 'png');
        this.loadFrameSet('general_attack', 'enemy_general/attack_frames_png/frame_', 6, 'png', 3);
        this.loadFrameSet('general_ultimate', 'enemy_general/skill_ultimate_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('general_walk_right', 'enemy_general/walk_right_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('general_walk_down', 'enemy_general/walk_down_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('general_walk_up', 'enemy_general/walk_up_frames/frames/frame_', 6, 'webp', 3);
        break;
      case 'lubu':
        this.loadSliceSet('lubu', 'enemy_lubu/slices_png', 'webp');
        this.loadFrameSet('lubu_walk', 'enemy_lubu/walk_left_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('lubu_attack', 'enemy_lubu/attack_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('lubu_skill', 'enemy_lubu/skill_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('lubu_ultimate', 'enemy_lubu/skill_ultimate_frames/frames/frame_', 6, 'webp', 3);
        break;
      case 'dianwei':
        this.loadSliceSet('dianwei', 'enemy_dianwei/slices_png', 'webp');
        this.loadFrameSet('dianwei_walk', 'enemy_dianwei/walk_left_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('dianwei_attack', 'enemy_dianwei/attack_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('dianwei_ultimate', 'enemy_dianwei/skill_frames/frames/frame_', 6, 'webp', 3);
        break;
      case 'xuzhu':
        this.loadSliceSet('xuzhu', 'enemy_xuzhu/slices_png', 'webp');
        this.loadFrameSet('xuzhu_walk', 'enemy_xuzhu/walk_left_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('xuzhu_attack', 'enemy_xuzhu/attack_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('xuzhu_skill', 'enemy_xuzhu/skill_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('xuzhu_ultimate', 'enemy_xuzhu/skill_ultimate_frames/frames/frame_', 6, 'webp', 3);
        break;
      case 'cavalry':
        this.loadSliceSet('cavalry', 'enemy_cavalry/slices_png', 'webp');
        this.loadFrameSet('cavalry_walk', 'enemy_cavalry/walk_left_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('cavalry_attack', 'enemy_cavalry/attack_frames/frames/frame_', 6, 'webp', 3);
        break;
      case 'archer':
        this.loadSliceSet('archer', 'enemy_archer/slices_png', 'webp');
        this.loadFrameSet('archer_walk', 'enemy_archer/walk_left_frames/frames/frame_', 6, 'webp', 3);
        this.loadFrameSet('archer_attack', 'enemy_archer/attack_frames/frames/frame_', 6, 'webp', 3);
        break;
    }
  }

  loadChapterAssets(chapter) {
    // 仅加载该章节所需的敌人、背景、貂蝉
    const types = AssetLoader.getChapterEnemyTypes(chapter);
    for (const t of types) this.loadEnemyType(t);
    this.loadChapterBackgrounds(chapter);
    if (chapter === 1) this.loadDiaoChanAssets();
  }

  loadChapterBackgrounds(chapter) {
    // 第一章背景文件名为 background，其余为 bg_chapterN
    const key = `bg_chapter_${chapter}`;
    if (!this.scene.textures.exists(key)) {
      const file = chapter === 1 ? 'background' : `bg_chapter${chapter}`;
      this.scene.load.image(key, `generated/${file}.webp`);
    }
  }

  loadDiaoChanAssets() {
    this.loadSliceSet('diaochan', 'diaochan/slices', 'webp');
    this.loadFrameSet('diaochan_tied', 'diaochan_tied/frames/frame_', 6, 'webp', 3);
  }

  loadCommonAssets() {
    if (!this.scene.textures.exists('arrow')) this.scene.load.image('arrow', 'generated/arrow.png');
    if (!this.scene.textures.exists('avatar')) this.scene.load.image('avatar', 'generated/avatar.png');
    for (let i = 0; i < 5; i++) {
      const types = ['weapon', 'armor', 'helmet', 'boots', 'accessory'];
      for (const type of types) {
        const key = `equip_${type}_${i}`;
        if (!this.scene.textures.exists(key)) {
          this.scene.load.image(key, `equipment/${type}_${i}.png`);
        }
      }
    }
  }

  loadEffectAssets() {
    const keys = [
      'projectile_arrow',
      'projectile_spear',
      'particle_spark',
      'particle_smoke',
      'particle_blood',
      'particle_gold',
      'drop_chest',
      'hint_arrow',
      'minimap_player',
      'minimap_boss',
      'minimap_drop'
    ];
    for (const key of keys) {
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, `generated_effects/${key}.png`);
      }
    }
  }

  // 启动阶段加载：玩家两套皮肤 + 通用 UI + 特效纹理
  // 不含敌人、章节背景、貂蝉（这些在进入章节时按需加载）
  loadBootAssets() {
    this.loadAllPlayerAssets();
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
