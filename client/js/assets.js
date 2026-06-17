const SLICE_PATHS = {
  front: 'assets/slices_png/front.png',
  front_right: 'assets/slices_png/front_right.png',
  right: 'assets/slices_png/right.png',
  back_right: 'assets/slices_png/back_right.png',
  back: 'assets/slices_png/back.png',
  back_left: 'assets/slices_png/back_left.png',
  left: 'assets/slices_png/left.png',
  front_left: 'assets/slices_png/front_left.png'
};

const SPEARMAN_SLICE_PATHS = {
  front: 'assets/enemy_spearman/slices_png/front.png',
  front_right: 'assets/enemy_spearman/slices_png/front_right.png',
  right: 'assets/enemy_spearman/slices_png/right.png',
  back_right: 'assets/enemy_spearman/slices_png/back_right.png',
  back: 'assets/enemy_spearman/slices_png/back.png',
  back_left: 'assets/enemy_spearman/slices_png/back_left.png',
  left: 'assets/enemy_spearman/slices_png/left.png',
  front_left: 'assets/enemy_spearman/slices_png/front_left.png'
};

const GENERAL_SLICE_PATHS = {
  front: 'assets/enemy_general/slices_png/front.png',
  front_right: 'assets/enemy_general/slices_png/front_right.png',
  right: 'assets/enemy_general/slices_png/right.png',
  back_right: 'assets/enemy_general/slices_png/back_right.png',
  back: 'assets/enemy_general/slices_png/back.png',
  back_left: 'assets/enemy_general/slices_png/back_left.png',
  left: 'assets/enemy_general/slices_png/left.png',
  front_left: 'assets/enemy_general/slices_png/front_left.png'
};

const LUBU_SLICE_PATHS = {
  front: 'assets/enemy_lubu/slices_png/front.webp',
  front_right: 'assets/enemy_lubu/slices_png/front_right.webp',
  right: 'assets/enemy_lubu/slices_png/right.webp',
  back_right: 'assets/enemy_lubu/slices_png/back_right.webp',
  back: 'assets/enemy_lubu/slices_png/back.webp',
  back_left: 'assets/enemy_lubu/slices_png/back_left.webp',
  left: 'assets/enemy_lubu/slices_png/left.webp',
  front_left: 'assets/enemy_lubu/slices_png/front_left.webp'
};

const CAVALRY_SLICE_PATHS = {
  front: 'assets/enemy_cavalry/slices_png/front.webp',
  front_right: 'assets/enemy_cavalry/slices_png/front_right.webp',
  right: 'assets/enemy_cavalry/slices_png/right.webp',
  back_right: 'assets/enemy_cavalry/slices_png/back_right.webp',
  back: 'assets/enemy_cavalry/slices_png/back.webp',
  back_left: 'assets/enemy_cavalry/slices_png/back_left.webp',
  left: 'assets/enemy_cavalry/slices_png/left.webp',
  front_left: 'assets/enemy_cavalry/slices_png/front_left.webp'
};

const SKILL_FRAMES = {
  0: [ // 普攻
    'assets/attack/frames_png/frame_001.png',
    'assets/attack/frames_png/frame_002.png',
    'assets/attack/frames_png/frame_003.png',
    'assets/attack/frames_png/frame_004.png'
  ],
  1: [ // 旋风斩
    'assets/whirlwind/frames_png/frame_001.png',
    'assets/whirlwind/frames_png/frame_002.png',
    'assets/whirlwind/frames_png/frame_003.png',
    'assets/whirlwind/frames_png/frame_004.png'
  ]
};

const DODGE_FRAMES = [
  'assets/dodge/frames_png/frame_001.png',
  'assets/dodge/frames_png/frame_002.png',
  'assets/dodge/frames_png/frame_003.png',
  'assets/dodge/frames_png/frame_004.png'
];

const HURT_FRAMES = [
  'assets/hurt/frames_png/frame_001.png',
  'assets/hurt/frames_png/frame_002.png',
  'assets/hurt/frames_png/frame_003.png',
  'assets/hurt/frames_png/frame_004.png'
];

const DEATH_FRAMES = [
  'assets/death/frames_png/frame_001.png',
  'assets/death/frames_png/frame_002.png',
  'assets/death/frames_png/frame_003.png',
  'assets/death/frames_png/frame_004.png'
];

const GENERAL_ATTACK_FRAMES = [
  'assets/enemy_general/attack_frames_png/frame_001.png',
  'assets/enemy_general/attack_frames_png/frame_002.png',
  'assets/enemy_general/attack_frames_png/frame_003.png',
  'assets/enemy_general/attack_frames_png/frame_004.png',
  'assets/enemy_general/attack_frames_png/frame_005.png',
  'assets/enemy_general/attack_frames_png/frame_006.png'
];

const GENERAL_WALK_RIGHT_FRAMES = [
  'assets/enemy_general/walk_right_frames/frames/frame_001.webp',
  'assets/enemy_general/walk_right_frames/frames/frame_002.webp',
  'assets/enemy_general/walk_right_frames/frames/frame_003.webp',
  'assets/enemy_general/walk_right_frames/frames/frame_004.webp',
  'assets/enemy_general/walk_right_frames/frames/frame_005.webp',
  'assets/enemy_general/walk_right_frames/frames/frame_006.webp'
];

const GENERAL_WALK_DOWN_FRAMES = [
  'assets/enemy_general/walk_down_frames/frames/frame_001.webp',
  'assets/enemy_general/walk_down_frames/frames/frame_002.webp',
  'assets/enemy_general/walk_down_frames/frames/frame_003.webp',
  'assets/enemy_general/walk_down_frames/frames/frame_004.webp',
  'assets/enemy_general/walk_down_frames/frames/frame_005.webp',
  'assets/enemy_general/walk_down_frames/frames/frame_006.webp'
];

const GENERAL_WALK_UP_FRAMES = [
  'assets/enemy_general/walk_up_frames/frames/frame_001.webp',
  'assets/enemy_general/walk_up_frames/frames/frame_002.webp',
  'assets/enemy_general/walk_up_frames/frames/frame_003.webp',
  'assets/enemy_general/walk_up_frames/frames/frame_004.webp',
  'assets/enemy_general/walk_up_frames/frames/frame_005.webp',
  'assets/enemy_general/walk_up_frames/frames/frame_006.webp'
];

const SPEARMAN_WALK_RIGHT_FRAMES = [
  'assets/enemy_spearman/walk_right_frames/frames/frame_001.webp',
  'assets/enemy_spearman/walk_right_frames/frames/frame_002.webp',
  'assets/enemy_spearman/walk_right_frames/frames/frame_003.webp',
  'assets/enemy_spearman/walk_right_frames/frames/frame_004.webp',
  'assets/enemy_spearman/walk_right_frames/frames/frame_005.webp',
  'assets/enemy_spearman/walk_right_frames/frames/frame_006.webp'
];

const SPEARMAN_WALK_DOWN_FRAMES = [
  'assets/enemy_spearman/walk_down_frames/frames/frame_001.webp',
  'assets/enemy_spearman/walk_down_frames/frames/frame_002.webp',
  'assets/enemy_spearman/walk_down_frames/frames/frame_003.webp',
  'assets/enemy_spearman/walk_down_frames/frames/frame_004.webp',
  'assets/enemy_spearman/walk_down_frames/frames/frame_005.webp',
  'assets/enemy_spearman/walk_down_frames/frames/frame_006.webp'
];

const SPEARMAN_WALK_UP_FRAMES = [
  'assets/enemy_spearman/walk_up_frames/frames/frame_001.webp',
  'assets/enemy_spearman/walk_up_frames/frames/frame_002.webp',
  'assets/enemy_spearman/walk_up_frames/frames/frame_003.webp',
  'assets/enemy_spearman/walk_up_frames/frames/frame_004.webp',
  'assets/enemy_spearman/walk_up_frames/frames/frame_005.webp',
  'assets/enemy_spearman/walk_up_frames/frames/frame_006.webp'
];

const SPEARMAN_ATTACK_FRAMES = [
  'assets/enemy_spearman/attack_frames/frames/frame_001.webp',
  'assets/enemy_spearman/attack_frames/frames/frame_002.webp',
  'assets/enemy_spearman/attack_frames/frames/frame_003.webp',
  'assets/enemy_spearman/attack_frames/frames/frame_004.webp',
  'assets/enemy_spearman/attack_frames/frames/frame_005.webp',
  'assets/enemy_spearman/attack_frames/frames/frame_006.webp'
];

const LUBU_WALK_LEFT_FRAMES = [
  'assets/enemy_lubu/walk_left_frames/frames/frame_001.webp',
  'assets/enemy_lubu/walk_left_frames/frames/frame_002.webp',
  'assets/enemy_lubu/walk_left_frames/frames/frame_003.webp',
  'assets/enemy_lubu/walk_left_frames/frames/frame_004.webp',
  'assets/enemy_lubu/walk_left_frames/frames/frame_005.webp',
  'assets/enemy_lubu/walk_left_frames/frames/frame_006.webp'
];

const LUBU_SKILL_FRAMES = [
  'assets/enemy_lubu/skill_frames/frames/frame_001.webp',
  'assets/enemy_lubu/skill_frames/frames/frame_002.webp',
  'assets/enemy_lubu/skill_frames/frames/frame_003.webp',
  'assets/enemy_lubu/skill_frames/frames/frame_004.webp',
  'assets/enemy_lubu/skill_frames/frames/frame_005.webp',
  'assets/enemy_lubu/skill_frames/frames/frame_006.webp'
];

const LUBU_ATTACK_FRAMES = [
  'assets/enemy_lubu/attack_frames/frames/frame_001.webp',
  'assets/enemy_lubu/attack_frames/frames/frame_002.webp',
  'assets/enemy_lubu/attack_frames/frames/frame_003.webp',
  'assets/enemy_lubu/attack_frames/frames/frame_004.webp',
  'assets/enemy_lubu/attack_frames/frames/frame_005.webp',
  'assets/enemy_lubu/attack_frames/frames/frame_006.webp'
];

const CAVALRY_WALK_LEFT_FRAMES = [
  'assets/enemy_cavalry/walk_left_frames/frames/frame_001.webp',
  'assets/enemy_cavalry/walk_left_frames/frames/frame_002.webp',
  'assets/enemy_cavalry/walk_left_frames/frames/frame_003.webp',
  'assets/enemy_cavalry/walk_left_frames/frames/frame_004.webp',
  'assets/enemy_cavalry/walk_left_frames/frames/frame_005.webp',
  'assets/enemy_cavalry/walk_left_frames/frames/frame_006.webp'
];

const CAVALRY_ATTACK_FRAMES = [
  'assets/enemy_cavalry/attack_frames/frames/frame_001.webp',
  'assets/enemy_cavalry/attack_frames/frames/frame_002.webp',
  'assets/enemy_cavalry/attack_frames/frames/frame_003.webp',
  'assets/enemy_cavalry/attack_frames/frames/frame_004.webp',
  'assets/enemy_cavalry/attack_frames/frames/frame_005.webp',
  'assets/enemy_cavalry/attack_frames/frames/frame_006.webp'
];

const PLAYER_ULTIMATE_FRAMES = [
  'assets/player_ultimate/frames/frame_001.webp',
  'assets/player_ultimate/frames/frame_002.webp',
  'assets/player_ultimate/frames/frame_003.webp',
  'assets/player_ultimate/frames/frame_004.webp',
  'assets/player_ultimate/frames/frame_005.webp',
  'assets/player_ultimate/frames/frame_006.webp'
];

const PLAYER_WALK_FRAMES = [
  'assets/player_walk/frames_png/frame_001.png',
  'assets/player_walk/frames_png/frame_002.png',
  'assets/player_walk/frames_png/frame_003.png',
  'assets/player_walk/frames_png/frame_004.png',
  'assets/player_walk/frames_png/frame_005.png',
  'assets/player_walk/frames_png/frame_006.png'
];

export const playerSlices = {};
export const playerSkillFrames = { 0: [], 1: [] };
export const playerDodgeFrames = [];
export const playerHurtFrames = [];
export const playerDeathFrames = [];
export const spearmanSlices = {};
export const generalSlices = {};
export const generalAttackFrames = [];
export const generalWalkRightFrames = [];
export const generalWalkDownFrames = [];
export const generalWalkUpFrames = [];
export const spearmanWalkRightFrames = [];
export const spearmanWalkDownFrames = [];
export const spearmanWalkUpFrames = [];
export const spearmanAttackFrames = [];
export const lubuSlices = {};
export const lubuWalkLeftFrames = [];
export const lubuSkillFrames = [];
export const lubuAttackFrames = [];
export const cavalrySlices = {};
export const cavalryWalkLeftFrames = [];
export const cavalryAttackFrames = [];
export const playerUltimateFrames = [];
export const playerWalkFrames = [];

const BACKGROUND_IMAGE = 'assets/background.png';

export const backgroundImage = new Image();

let loadedCount = 0;
let totalCount = Object.keys(SLICE_PATHS).length + Object.keys(SPEARMAN_SLICE_PATHS).length + Object.keys(GENERAL_SLICE_PATHS).length + Object.keys(LUBU_SLICE_PATHS).length + Object.keys(CAVALRY_SLICE_PATHS).length + 1; // +1 for background
for (const frames of Object.values(SKILL_FRAMES)) totalCount += frames.length;
totalCount += DODGE_FRAMES.length;
totalCount += HURT_FRAMES.length;
totalCount += DEATH_FRAMES.length;
totalCount += GENERAL_ATTACK_FRAMES.length;
totalCount += GENERAL_WALK_RIGHT_FRAMES.length + GENERAL_WALK_DOWN_FRAMES.length + GENERAL_WALK_UP_FRAMES.length;
totalCount += SPEARMAN_WALK_RIGHT_FRAMES.length + SPEARMAN_WALK_DOWN_FRAMES.length + SPEARMAN_WALK_UP_FRAMES.length;
totalCount += SPEARMAN_ATTACK_FRAMES.length;
totalCount += LUBU_WALK_LEFT_FRAMES.length + LUBU_SKILL_FRAMES.length + LUBU_ATTACK_FRAMES.length;
totalCount += CAVALRY_WALK_LEFT_FRAMES.length + CAVALRY_ATTACK_FRAMES.length;
totalCount += PLAYER_ULTIMATE_FRAMES.length;
totalCount += PLAYER_WALK_FRAMES.length;
let onLoadCallback = null;

function onImageLoad() {
  loadedCount++;
  if (loadedCount === totalCount && onLoadCallback) {
    onLoadCallback();
  }
}

function onImageError(path) {
  console.warn(`无法加载角色素材: ${path}`);
  onImageLoad();
}

export function loadPlayerAssets(callback) {
  onLoadCallback = callback;

  backgroundImage.onload = onImageLoad;
  backgroundImage.onerror = () => onImageError(BACKGROUND_IMAGE);
  backgroundImage.src = BACKGROUND_IMAGE;

  for (const [dir, path] of Object.entries(SLICE_PATHS)) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    playerSlices[dir] = img;
  }

  for (const [dir, path] of Object.entries(SPEARMAN_SLICE_PATHS)) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    spearmanSlices[dir] = img;
  }

  for (const [dir, path] of Object.entries(GENERAL_SLICE_PATHS)) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    generalSlices[dir] = img;
  }

  for (const [dir, path] of Object.entries(LUBU_SLICE_PATHS)) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    lubuSlices[dir] = img;
  }

  for (const path of LUBU_WALK_LEFT_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    lubuWalkLeftFrames.push(img);
  }

  for (const path of LUBU_SKILL_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    lubuSkillFrames.push(img);
  }

  for (const path of LUBU_ATTACK_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    lubuAttackFrames.push(img);
  }

  for (const [dir, path] of Object.entries(CAVALRY_SLICE_PATHS)) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    cavalrySlices[dir] = img;
  }

  for (const path of CAVALRY_WALK_LEFT_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    cavalryWalkLeftFrames.push(img);
  }

  for (const path of CAVALRY_ATTACK_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    cavalryAttackFrames.push(img);
  }

  for (const [skillIdx, frames] of Object.entries(SKILL_FRAMES)) {
    for (const path of frames) {
      const img = new Image();
      img.onload = onImageLoad;
      img.onerror = () => onImageError(path);
      img.src = path;
      playerSkillFrames[skillIdx].push(img);
    }
  }

  for (const path of DODGE_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    playerDodgeFrames.push(img);
  }

  for (const path of HURT_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    playerHurtFrames.push(img);
  }

  for (const path of DEATH_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    playerDeathFrames.push(img);
  }

  for (const path of GENERAL_ATTACK_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    generalAttackFrames.push(img);
  }

  for (const path of GENERAL_WALK_RIGHT_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    generalWalkRightFrames.push(img);
  }
  for (const path of GENERAL_WALK_DOWN_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    generalWalkDownFrames.push(img);
  }
  for (const path of GENERAL_WALK_UP_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    generalWalkUpFrames.push(img);
  }

  for (const path of SPEARMAN_WALK_RIGHT_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    spearmanWalkRightFrames.push(img);
  }
  for (const path of SPEARMAN_WALK_DOWN_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    spearmanWalkDownFrames.push(img);
  }
  for (const path of SPEARMAN_WALK_UP_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    spearmanWalkUpFrames.push(img);
  }

  for (const path of SPEARMAN_ATTACK_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    spearmanAttackFrames.push(img);
  }

  for (const path of PLAYER_ULTIMATE_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    playerUltimateFrames.push(img);
  }

  for (const path of PLAYER_WALK_FRAMES) {
    const img = new Image();
    img.onload = onImageLoad;
    img.onerror = () => onImageError(path);
    img.src = path;
    playerWalkFrames.push(img);
  }
}

function resolveSliceDir(dir) {
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

function resolveWalkDir4(dir) {
  let a = dir;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;

  if (a >= -Math.PI / 4 && a < Math.PI / 4) return 'right';
  if (a >= Math.PI / 4 && a < 3 * Math.PI / 4) return 'down';
  if (a >= 3 * Math.PI / 4 || a < -3 * Math.PI / 4) return 'left';
  return 'up';
}

export function getPlayerSlice(dir) {
  return playerSlices[resolveSliceDir(dir)];
}

export function getSpearmanSlice(dir) {
  return spearmanSlices[resolveSliceDir(dir)];
}

export function getGeneralSlice(dir) {
  return generalSlices[resolveSliceDir(dir)];
}

export function getGeneralAttackFrame(frameIndex) {
  if (!generalAttackFrames || generalAttackFrames.length === 0) return null;
  return generalAttackFrames[frameIndex % generalAttackFrames.length];
}

export function getGeneralWalkFrame(dir, frameIndex) {
  const d = resolveWalkDir4(dir);
  const frames =
    d === 'right' || d === 'left' ? generalWalkRightFrames :
    d === 'down' ? generalWalkDownFrames :
    d === 'up' ? generalWalkUpFrames : null;
  if (!frames || frames.length === 0) return null;
  return frames[frameIndex % frames.length];
}

export function getSpearmanWalkFrame(dir, frameIndex) {
  const d = resolveWalkDir4(dir);
  const frames =
    d === 'right' || d === 'left' ? spearmanWalkRightFrames :
    d === 'down' ? spearmanWalkDownFrames :
    d === 'up' ? spearmanWalkUpFrames : null;
  if (!frames || frames.length === 0) return null;
  return frames[frameIndex % frames.length];
}

export function getSpearmanAttackFrame(frameIndex) {
  if (!spearmanAttackFrames || spearmanAttackFrames.length === 0) return null;
  return spearmanAttackFrames[frameIndex % spearmanAttackFrames.length];
}

export function getLubuSlice(dir) {
  return lubuSlices[resolveSliceDir(dir)];
}

export function getLubuWalkFrame(frameIndex) {
  if (!lubuWalkLeftFrames || lubuWalkLeftFrames.length === 0) return null;
  return lubuWalkLeftFrames[frameIndex % lubuWalkLeftFrames.length];
}

export function getLubuSkillFrame(frameIndex) {
  if (!lubuSkillFrames || lubuSkillFrames.length === 0) return null;
  return lubuSkillFrames[frameIndex % lubuSkillFrames.length];
}

export function getLubuAttackFrame(frameIndex) {
  if (!lubuAttackFrames || lubuAttackFrames.length === 0) return null;
  return lubuAttackFrames[frameIndex % lubuAttackFrames.length];
}

export function getCavalrySlice(dir) {
  return cavalrySlices[resolveSliceDir(dir)];
}

export function getCavalryWalkFrame(frameIndex) {
  if (!cavalryWalkLeftFrames || cavalryWalkLeftFrames.length === 0) return null;
  return cavalryWalkLeftFrames[frameIndex % cavalryWalkLeftFrames.length];
}

export function getCavalryAttackFrame(frameIndex) {
  if (!cavalryAttackFrames || cavalryAttackFrames.length === 0) return null;
  return cavalryAttackFrames[frameIndex % cavalryAttackFrames.length];
}

export function getPlayerWalkFrame(frameIndex) {
  if (!playerWalkFrames || playerWalkFrames.length === 0) return null;
  return playerWalkFrames[frameIndex % playerWalkFrames.length];
}

export function getPlayerUltimateFrame(frameIndex) {
  if (!playerUltimateFrames || playerUltimateFrames.length === 0) return null;
  return playerUltimateFrames[frameIndex % playerUltimateFrames.length];
}

export function getPlayerSkillFrame(skillIdx, frameIndex) {
  const frames = playerSkillFrames[skillIdx];
  if (!frames || frames.length === 0) return null;
  return frames[frameIndex % frames.length];
}

export function getPlayerDodgeFrame(frameIndex) {
  if (!playerDodgeFrames || playerDodgeFrames.length === 0) return null;
  return playerDodgeFrames[frameIndex % playerDodgeFrames.length];
}

export function getPlayerHurtFrame(frameIndex) {
  if (!playerHurtFrames || playerHurtFrames.length === 0) return null;
  return playerHurtFrames[frameIndex % playerHurtFrames.length];
}

export function getPlayerDeathFrame(frameIndex) {
  if (!playerDeathFrames || playerDeathFrames.length === 0) return null;
  return playerDeathFrames[frameIndex % playerDeathFrames.length];
}

export function allAssetsLoaded() {
  return loadedCount === totalCount;
}
