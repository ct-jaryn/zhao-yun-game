import { W, H, MAP_W, MAP_H, TERRAIN } from './config.js';
import { ctx, minimapCtx, screenShake } from './utils.js';
import { backgroundImage } from './assets.js';

export function clear() {
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);
  ctx.clearRect(-10, -10, W + 20, H + 20);
}

export function restore() {
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 战场背景装饰（预生成，避免每帧随机闪烁）
// ---------------------------------------------------------------------------
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

const BATTLEFIELD = generateBattlefieldDecor();

function generateBattlefieldDecor() {
  const patches = [];
  const ruts = [];
  const stones = [];
  const bushes = [];
  const tents = [];
  const mountains = [];

  // 1. 草地斑块：多种绿色，半透明椭圆，让泥土地不那么单调
  const grassColors = ['#4a7c18', '#3e6b14', '#568a22', '#2f5a0f', '#6a9b32'];
  for (let i = 0; i < 180; i++) {
    patches.push({
      x: rand(0, MAP_W), y: rand(0, MAP_H),
      rx: rand(40, 120), ry: rand(25, 80),
      rot: rand(0, Math.PI),
      color: grassColors[randInt(0, grassColors.length - 1)],
      alpha: rand(0.12, 0.28)
    });
  }

  // 2. 车辙土路：深色曲线路径贯穿战场
  const rutPaths = 4;
  for (let i = 0; i < rutPaths; i++) {
    const points = [];
    const segments = 6;
    const startX = i < 2 ? 0 : rand(200, MAP_W - 200);
    const startY = i < 2 ? rand(200, MAP_H - 200) : 0;
    const endX = i < 2 ? MAP_W : rand(200, MAP_W - 200);
    const endY = i < 2 ? rand(200, MAP_H - 200) : MAP_H;
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      points.push({
        x: startX + (endX - startX) * t + rand(-120, 120),
        y: startY + (endY - startY) * t + rand(-120, 120)
      });
    }
    ruts.push({ width: rand(35, 55), points });
  }

  // 3. 石块
  for (let i = 0; i < 90; i++) {
    stones.push({
      x: rand(0, MAP_W), y: rand(0, MAP_H),
      rx: rand(6, 18), ry: rand(5, 14),
      rot: rand(0, Math.PI),
      color: Math.random() > 0.5 ? '#6b6560' : '#7a7269'
    });
  }

  // 4. 灌木丛
  for (let i = 0; i < 50; i++) {
    bushes.push({
      x: rand(0, MAP_W), y: rand(0, MAP_H),
      r: rand(15, 35),
      color: Math.random() > 0.5 ? '#2a5010' : '#1f3d0a'
    });
  }

  // 5. 曹军营地：营帐+旗帜，集中在地图边缘几处
  const campColors = ['#e8e0d0', '#d8d0c0', '#efe8dc'];
  const campCenters = [
    { x: 220, y: 220 }, { x: MAP_W - 250, y: 180 },
    { x: 200, y: MAP_H - 220 }, { x: MAP_W - 230, y: MAP_H - 200 },
    { x: MAP_W / 2, y: 150 }
  ];
  for (const c of campCenters) {
    const count = randInt(3, 5);
    for (let i = 0; i < count; i++) {
      const tx = c.x + rand(-120, 120);
      const ty = c.y + rand(-80, 80);
      tents.push({
        x: tx, y: ty,
        w: rand(50, 80), h: rand(35, 55),
        color: campColors[randInt(0, campColors.length - 1)],
        flagX: tx + rand(25, 45),
        flagY: ty - rand(15, 30)
      });
    }
  }

  // 6. 远处山脉轮廓（仅地图边缘）
  const mountainRanges = [
    { yBase: 0, w: MAP_W, peaks: 9 },
    { yBase: MAP_H, w: MAP_W, peaks: 9 },
    { xBase: 0, h: MAP_H, peaks: 6 },
    { xBase: MAP_W, h: MAP_H, peaks: 6 }
  ];
  for (const r of mountainRanges) {
    const pts = [];
    if (r.yBase !== undefined) {
      for (let i = 0; i <= r.peaks; i++) {
        pts.push({ x: (r.w / r.peaks) * i, y: r.yBase + rand(-60, 60) });
      }
    } else {
      for (let i = 0; i <= r.peaks; i++) {
        pts.push({ x: r.xBase + rand(-60, 60), y: (r.h / r.peaks) * i });
      }
    }
    mountains.push({ pts, horizontal: r.yBase !== undefined, base: r.yBase ?? r.xBase });
  }

  return { patches, ruts, stones, bushes, tents, mountains };
}

function drawDecorLayer(cam) {
  const { patches, ruts, stones, bushes, tents, mountains } = BATTLEFIELD;

  // 草地斑块
  for (const p of patches) {
    if (!onScreen(p.x - p.rx, p.y - p.ry, p.rx * 2, p.ry * 2, cam)) continue;
    ctx.save();
    ctx.translate(p.x - cam.x, p.y - cam.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // 车辙土路
  ctx.save();
  for (const r of ruts) {
    ctx.strokeStyle = 'rgba(95,75,50,0.35)';
    ctx.lineWidth = r.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(r.points[0].x - cam.x, r.points[0].y - cam.y);
    for (let i = 1; i < r.points.length; i++) {
      const p = r.points[i];
      ctx.lineTo(p.x - cam.x, p.y - cam.y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // 石块
  for (const s of stones) {
    if (!onScreen(s.x - s.rx, s.y - s.ry, s.rx * 2, s.ry * 2, cam)) continue;
    ctx.save();
    ctx.translate(s.x - cam.x, s.y - cam.y);
    ctx.rotate(s.rot);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 灌木丛
  for (const b of bushes) {
    if (!onScreen(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2, cam)) continue;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x - cam.x, b.y - cam.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    // 几道草叶
    ctx.strokeStyle = 'rgba(30,60,10,0.4)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(b.x - cam.x, b.y - cam.y);
      ctx.lineTo(b.x - cam.x + Math.cos(a) * b.r * 0.9, b.y - cam.y + Math.sin(a) * b.r * 0.9);
      ctx.stroke();
    }
  }

  // 营帐与旗帜
  for (const t of tents) {
    if (!onScreen(t.x - t.w, t.y - t.h, t.w * 2, t.h * 2, cam)) continue;
    const x = t.x - cam.x, y = t.y - cam.y;
    // 帐底阴影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + t.h * 0.45, t.w * 0.55, t.h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    // 帐身（半圆/锥形）
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.moveTo(x - t.w / 2, y + t.h / 2);
    ctx.quadraticCurveTo(x, y - t.h / 2, x + t.w / 2, y + t.h / 2);
    ctx.closePath();
    ctx.fill();
    // 帐门
    ctx.fillStyle = 'rgba(60,45,35,0.35)';
    ctx.beginPath();
    ctx.moveTo(x - t.w * 0.12, y + t.h / 2);
    ctx.quadraticCurveTo(x, y + t.h * 0.1, x + t.w * 0.12, y + t.h / 2);
    ctx.closePath();
    ctx.fill();
    // 旗杆
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(t.flagX - cam.x, t.flagY - cam.y);
    ctx.lineTo(t.flagX - cam.x, t.flagY - cam.y - 35);
    ctx.stroke();
    // 红旗
    ctx.fillStyle = '#b22222';
    ctx.beginPath();
    ctx.moveTo(t.flagX - cam.x, t.flagY - cam.y - 35);
    ctx.lineTo(t.flagX - cam.x + 24, t.flagY - cam.y - 26);
    ctx.lineTo(t.flagX - cam.x, t.flagY - cam.y - 17);
    ctx.closePath();
    ctx.fill();
  }

  // 远处山脉轮廓
  ctx.fillStyle = 'rgba(55,45,35,0.55)';
  for (const m of mountains) {
    ctx.beginPath();
    if (m.horizontal) {
      const ySign = m.base === 0 ? 1 : -1;
      ctx.moveTo(0 - cam.x, m.base - cam.y);
      for (const p of m.pts) ctx.lineTo(p.x - cam.x, p.y - cam.y);
      ctx.lineTo(MAP_W - cam.x, m.base - cam.y);
      ctx.lineTo(MAP_W - cam.x, m.base - cam.y + ySign * 120);
      ctx.lineTo(0 - cam.x, m.base - cam.y + ySign * 120);
    } else {
      const xSign = m.base === 0 ? 1 : -1;
      ctx.moveTo(m.base - cam.x, 0 - cam.y);
      for (const p of m.pts) ctx.lineTo(p.x - cam.x, p.y - cam.y);
      ctx.lineTo(m.base - cam.x, MAP_H - cam.y);
      ctx.lineTo(m.base - cam.x + xSign * 120, MAP_H - cam.y);
      ctx.lineTo(m.base - cam.x + xSign * 120, 0 - cam.y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function onScreen(x, y, w, h, cam) {
  return x + w >= cam.x - 50 && x <= cam.x + W + 50 && y + h >= cam.y - 50 && y <= cam.y + H + 50;
}

export function drawBackground(cam) {
  if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth) {
    const imgW = backgroundImage.naturalWidth;
    const imgH = backgroundImage.naturalHeight;
    // 平铺绘制地面纹理，避免单张大图跟随相机移动产生“飞行”感
    const startX = Math.floor(cam.x / imgW) * imgW;
    const startY = Math.floor(cam.y / imgH) * imgH;
    const endX = cam.x + W;
    const endY = cam.y + H;
    ctx.save();
    ctx.filter = 'blur(1px)';
    for (let x = startX; x < endX + imgW; x += imgW) {
      for (let y = startY; y < endY + imgH; y += imgH) {
        ctx.drawImage(backgroundImage, x - cam.x, y - cam.y, imgW, imgH);
      }
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#3a6b10';
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.06;
    for (let gx = 0; gx < W; gx += 40) {
      for (let gy = 0; gy < H; gy += 40) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = '#2a5a08';
          ctx.fillRect(gx, gy, 40, 40);
        }
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(120,90,50,0.2)';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const paths = [
      [[0, MAP_H/2], [MAP_W/3, MAP_H/2-50], [MAP_W*2/3, MAP_H/2+30], [MAP_W, MAP_H/2]],
      [[MAP_W/2, 0], [MAP_W/2-40, MAP_H/3], [MAP_W/2+60, MAP_H*2/3], [MAP_W/2, MAP_H]]
    ];
    for (const path of paths) {
      ctx.beginPath();
      ctx.moveTo(path[0][0] - cam.x, path[0][1] - cam.y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0] - cam.x, path[i][1] - cam.y);
      ctx.stroke();
    }
  }

  // 若背景图未加载，叠加程序化战场细节作为兜底
  if (!(backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth)) {
    drawDecorLayer(cam);
  }

  ctx.strokeStyle = 'rgba(200,50,50,0.4)';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(-cam.x, -cam.y, MAP_W, MAP_H);
  ctx.setLineDash([]);
}

export function drawDirectionHints(cam, enemies) {
  const margin = 40;
  for (const e of enemies) {
    if (e.dead) continue;
    const sx = e.x - cam.x, sy = e.y - cam.y;
    if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) continue;

    const cx = W / 2, cy = H / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const ax = Math.max(margin, Math.min(W - margin, cx + Math.cos(angle) * Math.min(W, H) * 0.45));
    const ay = Math.max(margin, Math.min(H - margin, cy + Math.sin(angle) * Math.min(W, H) * 0.45));

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.fillStyle = e.type === 'boss' ? 'rgba(255,0,255,0.6)' : 'rgba(255,80,80,0.4)';
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawMinimap(player, cam, enemies, drops) {
  const mw = 140, mh = 110;
  minimapCtx.clearRect(0, 0, mw, mh);

  minimapCtx.fillStyle = 'rgba(45,30,20,0.85)';
  minimapCtx.fillRect(0, 0, mw, mh);

  minimapCtx.strokeStyle = 'rgba(200,162,85,0.3)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(0, 0, mw, mh);

  const sx = mw / MAP_W, sy = mh / MAP_H;

  minimapCtx.fillStyle = 'rgba(60,40,25,0.6)';
  for (const f of TERRAIN) {
    minimapCtx.beginPath();
    minimapCtx.arc(f.x * sx, f.y * sy, Math.max(2, f.r * sx * 0.5), 0, Math.PI * 2);
    minimapCtx.fill();
  }

  for (const d of drops) {
    minimapCtx.fillStyle = d.equip.quality.color;
    minimapCtx.fillRect(d.x * sx - 1, d.y * sy - 1, 2, 2);
  }

  for (const e of enemies) {
    if (e.dead) continue;
    minimapCtx.fillStyle = e.type === 'boss' ? '#ff44ff' : '#ff4444';
    const s = e.type === 'boss' ? 3 : 2;
    minimapCtx.fillRect(e.x * sx - s / 2, e.y * sy - s / 2, s, s);
  }

  minimapCtx.fillStyle = '#44ff44';
  minimapCtx.beginPath();
  minimapCtx.arc(player.x * sx, player.y * sy, 3, 0, Math.PI * 2);
  minimapCtx.fill();

  minimapCtx.strokeStyle = 'rgba(255,255,255,0.3)';
  minimapCtx.lineWidth = 0.5;
  minimapCtx.strokeRect(cam.x * sx, cam.y * sy, W * sx, H * sy);

  minimapCtx.strokeStyle = 'rgba(200,162,85,0.4)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(0, 0, mw, mh);
}
