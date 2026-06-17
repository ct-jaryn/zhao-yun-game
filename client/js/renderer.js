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
