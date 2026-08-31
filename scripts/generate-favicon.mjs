/**
 * 构建时生成完整 favicon 套件（零外部依赖，纯 Node 内置模块）
 * 产物:
 *   - public/favicon.svg            矢量主图标（现代浏览器）
 *   - public/favicon.ico            16/32/48 多尺寸 ICO（传统浏览器/百度收录图标）
 *   - public/favicon-16/32/96/192/512.png   PNG 套件
 *   - public/apple-touch-icon.png   180x180 iOS 主屏图标
 *   - public/maskable-icon.png      512 中心留白（PWA maskable）
 * 由 prebuild 钩子自动执行。
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ============ PNG 编码（无依赖实现） ============
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
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(rgba, w, h) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ============ ICO 封装（内嵌 PNG，Vista+ 全兼容） ============
function encodeICO(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);
  const dirSize = 16 * count;
  let offset = 6 + dirSize;
  const entries = [];
  const datas = [];
  for (const { size, png } of images) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size; // width
    e[1] = size >= 256 ? 0 : size; // height
    e[2] = 0; // palette
    e[3] = 0; // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(e);
    datas.push(png);
  }
  return Buffer.concat([header, ...entries, ...datas]);
}

// ============ 绘图 ============
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * 绘制图标（盾牌 + 对勾），size 为边长。
 * 小尺寸下自动加粗笔画以保证可辨识度。
 */
function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const s = size; // 逻辑坐标系 0..s
  const px = (x, y, r, g, b, a) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || xi >= s || yi < 0 || yi >= s || a <= 0) return;
    const i = (yi * s + xi) * 4;
    const dstA = buf[i + 3] / 255;
    const outA = a + dstA * (1 - a);
    if (outA <= 0) return;
    buf[i] = Math.round((r * a + buf[i] * dstA * (1 - a)) / outA);
    buf[i + 1] = Math.round((g * a + buf[i + 1] * dstA * (1 - a)) / outA);
    buf[i + 2] = Math.round((b * a + buf[i + 2] * dstA * (1 - a)) / outA);
    buf[i + 3] = Math.round(outA * 255);
  };

  const CX = s / 2;
  const CY = s / 2;

  // ---- 1. 圆角方形渐变背景（深蓝 → 靛蓝）；小尺寸用纯色保辨识度 ----
  const R = s * 0.22; // 圆角半径
  const small = size <= 32; // 小尺寸：纯色 + 更强对比
  const sdRounded = (x, y) => {
    const dx = Math.abs(x - CX) - (CX - R);
    const dy = Math.abs(y - CY) - (CY - R);
    const d = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
    return Math.min(Math.max(dx, dy), 0) + d - R;
  };
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const d = sdRounded(x + 0.5, y + 0.5);
      const cover = clamp(0.5 - d, 0, 1);
      if (cover > 0) {
        const t = small ? 0.5 : clamp(((x + y) / (2 * s)) * 1.15, 0, 1);
        const i = (y * s + x) * 4;
        // 抗锯齿边缘：与透明底混合
        const r = small ? 55 : lerp(30, 79, t);
        const g = small ? 63 : lerp(58, 70, t);
        const b = small ? 184 : lerp(138, 229, t);
        buf[i] = Math.round(r * cover + buf[i] * (1 - cover));
        buf[i + 1] = Math.round(g * cover + buf[i + 1] * (1 - cover));
        buf[i + 2] = Math.round(b * cover + buf[i + 2] * (1 - cover));
        buf[i + 3] = Math.round(255 * cover + buf[i + 3] * (1 - cover));
      }
    }
  }

  // ---- 2. 盾牌 ----
  const SW = s * 0.44; // 盾宽
  const SH = s * 0.5; // 盾高
  const shieldHalf = (ry) => {
    const t = (ry + SH / 2) / SH;
    if (t < 0.12) return (SW / 2) * lerp(0.6, 1, smoothstep(0, 0.12, t));
    if (t < 0.6) return SW / 2;
    const u = (t - 0.6) / 0.4;
    return (SW / 2) * Math.pow(Math.cos((u * Math.PI) / 2), 0.85);
  };
  const shieldSDF = (x, y) => {
    const rx = x - CX;
    const ry = y - CY;
    const hw = shieldHalf(ry);
    if (ry < -SH / 2) return Math.hypot(rx, ry + SH / 2);
    if (ry > SH / 2) return Math.hypot(rx, ry - SH / 2);
    return Math.abs(rx) - hw;
  };
  for (let y = Math.floor(CY - SH / 2) - 2; y <= Math.ceil(CY + SH / 2) + 2; y++) {
    for (let x = Math.floor(CX - SW / 2) - 2; x <= Math.ceil(CX + SW / 2) + 2; x++) {
      if (x < 0 || y < 0 || x >= s || y >= s) continue;
      const d = shieldSDF(x + 0.5, y + 0.5);
      const cover = clamp(0.5 - d, 0, 1);
      if (cover > 0) {
        const t = clamp((y - (CY - SH / 2)) / SH, 0, 1);
        px(x + 0.5, y + 0.5, lerp(255, 235, t), lerp(255, 244, t), lerp(255, 252, t), cover * 0.98);
      }
    }
  }

  // ---- 3. 对勾（小尺寸加粗） ----
  const stroke = size <= 32 ? s * 0.09 : size <= 96 ? s * 0.075 : s * 0.065;
  const P1 = [CX - SW * 0.19, CY + SH * 0.02];
  const P2 = [CX - SW * 0.05, CY + SH * 0.16];
  const P3 = [CX + SW * 0.21, CY - SH * 0.13];
  const segDist = (p, a, b) => {
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const t = clamp(((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / (abx * abx + aby * aby), 0, 1);
    return Math.hypot(p[0] - (a[0] + abx * t), p[1] - (a[1] + aby * t));
  };
  const checkDist = (x, y) => Math.min(segDist([x, y], P1, P2), segDist([x, y], P2, P3));
  for (let y = Math.floor(CY - SH * 0.3); y <= Math.ceil(CY + SH * 0.3); y++) {
    for (let x = Math.floor(CX - SW * 0.35); x <= Math.ceil(CX + SW * 0.35); x++) {
      if (x < 0 || y < 0 || x >= s || y >= s) continue;
      const d = checkDist(x + 0.5, y + 0.5);
      const cover = clamp(0.5 - (d - stroke / 2), 0, 1);
      if (cover > 0) {
        const t = clamp((y - (CY - SH * 0.2)) / (SH * 0.5), 0, 1);
        px(x + 0.5, y + 0.5, lerp(16, 52, t), lerp(185, 211, t), lerp(129, 153, t), cover);
      }
    }
  }
  return buf;
}

// ============ 矢量版 favicon.svg ============
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e3a8a"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
    <linearGradient id="check" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="1" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="shield" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#ebf4fc"/>
    </linearGradient>
  </defs>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bg)"/>
  <path d="M256 96 L384 144 V264 C384 328 336 384 256 424 C176 384 128 328 128 264 V144 Z" fill="url(#shield)"/>
  <path d="M196 256 L240 304 L330 196" fill="none" stroke="url(#check)" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// ============ maskable 图标（中心 80% 安全区，背景铺满） ============
function drawMaskable(size) {
  const buf = drawIcon(size);
  const s = size;
  const out = Buffer.alloc(size * size * 4);
  // 背景铺满纯色（maskable 不允许透明边）
  for (let i = 0; i < s * s; i++) {
    out[i * 4] = 37;
    out[i * 4 + 1] = 58;
    out[i * 4 + 2] = 128;
    out[i * 4 + 3] = 255;
  }
  // 将主体缩至 76% 居中绘制
  const k = 0.76;
  const src = s * k;
  const off = (s - src) / 2;
  for (let y = 0; y < Math.ceil(src); y++) {
    for (let x = 0; x < Math.ceil(src); x++) {
      const sy = Math.floor((y / src) * s);
      const sx = Math.floor((x / src) * s);
      const si = (sy * s + sx) * 4;
      const di = (Math.floor(off + y) * s + Math.floor(off + x)) * 4;
      const a = buf[si + 3] / 255;
      if (a > 0) {
        out[di] = Math.round(buf[si] * a + out[di] * (1 - a));
        out[di + 1] = Math.round(buf[si + 1] * a + out[di + 1] * (1 - a));
        out[di + 2] = Math.round(buf[si + 2] * a + out[di + 2] * (1 - a));
        out[di + 3] = 255;
      }
    }
  }
  return out;
}

// ============ 生成 ============
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, 'favicon.svg'), FAVICON_SVG);

const sizes = [16, 32, 96, 192, 512];
const pngs = {};
for (const sz of sizes) {
  pngs[sz] = encodePNG(drawIcon(sz), sz, sz);
  writeFileSync(join(outDir, `favicon-${sz}.png`), pngs[sz]);
}
writeFileSync(join(outDir, 'apple-touch-icon.png'), encodePNG(drawIcon(180), 180, 180));
writeFileSync(join(outDir, 'maskable-icon.png'), encodePNG(drawMaskable(512), 512, 512));

// ICO：16 + 32 + 48（48 由 drawIcon 生成）
pngs[48] = encodePNG(drawIcon(48), 48, 48);
const ico = encodeICO([
  { size: 16, png: pngs[16] },
  { size: 32, png: pngs[32] },
  { size: 48, png: pngs[48] },
]);
writeFileSync(join(outDir, 'favicon.ico'), ico);

const kb = (n) => (n / 1024).toFixed(1);
console.log(`✓ favicon 套件已生成:
  favicon.svg          (矢量主图标)
  favicon.ico          (${kb(ico.length)} KB, 16/32/48)
  favicon-16/32/96/192/512.png
  apple-touch-icon.png (180x180)
  maskable-icon.png    (512x512)`);
