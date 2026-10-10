/**
 * 构建时生成 OG 分享图（public/og-default.png, 1200x630）
 * 仅使用 Node 内置模块（zlib），无需任何外部依赖。
 * 由 package.json 的 prebuild 钩子自动执行。
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const W = 1200;
const H = 630;

// ============ PNG 编码 ============
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // 每行前置 filter 字节 0
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0;
    rgba.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ============ 绘图工具 ============
const buf = Buffer.alloc(W * H * 4);

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 像素混合：src 以 alpha 覆盖到目标
function blendPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H || a <= 0) return;
  const i = (y * W + x) * 4;
  const dstA = buf[i + 3] / 255;
  const outA = a + dstA * (1 - a);
  if (outA <= 0) return;
  buf[i] = Math.round((r * a + buf[i] * dstA * (1 - a)) / outA);
  buf[i + 1] = Math.round((g * a + buf[i + 1] * dstA * (1 - a)) / outA);
  buf[i + 2] = Math.round((b * a + buf[i + 2] * dstA * (1 - a)) / outA);
  buf[i + 3] = Math.round(outA * 255);
}

// ============ 1. 背景渐变（深蓝 → 靛蓝，对角线） ============
const BG_TOP = [22, 37, 94]; // #16255e
const BG_BOT = [62, 58, 178]; // #3e3ab2
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = clamp((x / W) * 0.42 + (y / H) * 0.58, 0, 1);
    const i = (y * W + x) * 4;
    buf[i] = lerp(BG_TOP[0], BG_BOT[0], t);
    buf[i + 1] = lerp(BG_TOP[1], BG_BOT[1], t);
    buf[i + 2] = lerp(BG_TOP[2], BG_BOT[2], t);
    buf[i + 3] = 255;
  }
}

// ============ 2. 径向光晕 ============
function addGlow(cx, cy, radius, color, maxAlpha) {
  for (let y = Math.max(0, cy - radius); y < Math.min(H, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x < Math.min(W, cx + radius); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < radius) {
        const a = maxAlpha * Math.pow(1 - d / radius, 2);
        const i = (y * W + x) * 4;
        buf[i] = Math.round(Math.min(255, buf[i] + color[0] * a));
        buf[i + 1] = Math.round(Math.min(255, buf[i + 1] + color[1] * a));
        buf[i + 2] = Math.round(Math.min(255, buf[i + 2] + color[2] * a));
      }
    }
  }
}
addGlow(600, 235, 340, [34, 211, 238], 0.13); // 顶部青色光晕
addGlow(120, 560, 300, [139, 92, 246], 0.10); // 左下紫色光晕
addGlow(1080, 540, 280, [34, 211, 238], 0.07); // 右下青色光晕

// ============ 3. 颗粒噪点点阵（种子随机，避开中心） ============
let seed = 20260831;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
for (let n = 0; n < 110; n++) {
  const x = Math.floor(rand() * W);
  const y = Math.floor(rand() * H);
  if (Math.hypot(x - 600, y - 300) < 265) continue; // 避开徽章区域
  const r = 1 + rand() * 1.6;
  const a = 0.04 + rand() * 0.13;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const d = Math.hypot(dx, dy);
      if (d <= r) blendPixel(x + dx, y + dy, 255, 255, 255, a * (1 - d / r));
    }
  }
}

// ============ 4. 盾牌主体 ============
const CX = 600;
const CY = 300;
const SW = 216; // 盾宽
const SH = 248; // 盾高

// 盾牌轮廓：给定相对 y∈[-SH/2, SH/2] 返回半宽
function shieldHalfWidth(ry) {
  const t = (ry + SH / 2) / SH; // 0 顶 → 1 底
  if (t < 0.1) return (SW / 2) * lerp(0.62, 1, smoothstep(0, 0.1, t)); // 圆肩
  if (t < 0.62) return SW / 2; // 直边
  const s = (t - 0.62) / 0.38;
  return (SW / 2) * Math.pow(Math.cos((s * Math.PI) / 2), 0.85); // 收拢成尖底
}

// 盾牌带符号距离（负值在内部）
function shieldSDF(x, y) {
  const rx = x - CX;
  const ry = y - CY;
  const hw = shieldHalfWidth(ry);
  if (ry < -SH / 2) return Math.hypot(rx, ry + SH / 2); // 上方
  if (ry > SH / 2) return Math.hypot(rx, ry - SH / 2); // 下方
  return Math.abs(rx) - hw; // 内部水平距离
}

for (let y = CY - SH / 2 - 4; y <= CY + SH / 2 + 4; y++) {
  for (let x = CX - SW / 2 - 4; x <= CX + SW / 2 + 4; x++) {
    const d = shieldSDF(x, y);
    if (d < 1) {
      // 抗锯齿覆盖度
      const cover = clamp(0.5 - d, 0, 1);
      // 顶部到底部轻微明度渐变
      const t = clamp((y - (CY - SH / 2)) / SH, 0, 1);
      const r = lerp(255, 235, t);
      const g = lerp(255, 244, t);
      const b = lerp(255, 252, t);
      // 边缘内阴影（贴近边界 6px 内偏蓝灰）
      const edge = 1 - clamp((Math.min(Math.abs(d), 6) - 0) / 6, 0, 1) * 0;
      blendPixel(Math.round(x), Math.round(y), r * edge, g * edge, b * edge, cover * 0.97);
    }
  }
}

// ============ 5. 同心圆环（信号波纹） ============
function drawRing(cx, cy, radius, alpha, thickness) {
  for (let y = Math.max(0, cy - radius - 2); y <= Math.min(H - 1, cy + radius + 2); y++) {
    for (let x = Math.max(0, cx - radius - 2); x <= Math.min(W - 1, cx + radius + 2); x++) {
      const d = Math.abs(Math.hypot(x - cx, y - cy) - radius);
      const a = alpha * (1 - smoothstep(0, thickness, d));
      if (a > 0.002) blendPixel(x, y, 255, 255, 255, a);
    }
  }
}
drawRing(CX, CY, 152, 0.11, 2.2);
drawRing(CX, CY, 186, 0.075, 2);
drawRing(CX, CY, 220, 0.05, 1.8);

// ============ 5. 盾牌内底部深色衬底（增加立体感，在对勾之下） ============
for (let y = CY + SH * 0.08; y <= CY + SH / 2 - 4; y++) {
  const ry = y - CY;
  const hw = shieldHalfWidth(ry) - 14;
  if (hw <= 0) continue;
  for (let x = CX - hw; x <= CX + hw; x++) {
    const d = Math.abs(x - CX) - hw;
    const cover = clamp(0.5 - d, 0, 1) * 0.16;
    blendPixel(Math.round(x), Math.round(y), 37, 99, 235, cover);
  }
}

// ============ 6. 绿色对勾 ============
const P1 = [-44, 6];
const P2 = [-12, 40];
const P3 = [48, -28];
const STROKE = 26;

function segDist(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const t = clamp((apx * abx + apy * aby) / (abx * abx + aby * aby), 0, 1);
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

function checkSDF(x, y) {
  const rx = x - CX;
  const ry = y - CY;
  return Math.min(
    segDist(rx, ry, P1[0], P1[1], P2[0], P2[1]),
    segDist(rx, ry, P2[0], P2[1], P3[0], P3[1])
  );
}

const GREEN = [16, 185, 129]; // #10b981
for (let y = CY - 70; y <= CY + 70; y++) {
  for (let x = CX - 80; x <= CX + 80; x++) {
    const d = checkSDF(x, y);
    if (d < STROKE / 2 + 1) {
      const cover = clamp(0.5 - (d - STROKE / 2), 0, 1);
      // 对勾轻微渐变
      const t = clamp((y - (CY - 40)) / 80, 0, 1);
      const gr = lerp(GREEN[0], 52, t);
      const gg = lerp(GREEN[1], 211, t);
      const gb = lerp(GREEN[2], 153, t);
      blendPixel(Math.round(x), Math.round(y), gr, gg, gb, cover);
    }
  }
}

// ============ 7. 输出 ============
const png = encodePNG(buf);
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-default.png');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`✓ OG 分享图已生成: public/og-default.png (${(png.length / 1024).toFixed(0)} KB, ${W}x${H})`);
