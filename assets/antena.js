// Estagiário — ADESIVO (sticker) renderer: moods, icon, wordmark. Base figure 240x235.
const TAU = Math.PI * 2,
  sin = Math.sin;
const LIME = '#C6F432',
  INK = '#141414',
  RED = '#FF4D2E',
  WHITE = '#FFFFFF';
const BORDER = 13;
function eRectP(p, x, y, w, h, trx, tr, brx, br) {
  p.moveTo(x + trx, y);
  p.lineTo(x + w - trx, y);
  p.ellipse(x + w - trx, y + tr, trx, tr, 0, -Math.PI / 2, 0);
  p.lineTo(x + w, y + h - br);
  p.ellipse(x + w - brx, y + h - br, brx, br, 0, 0, Math.PI / 2);
  p.lineTo(x + brx, y + h);
  p.ellipse(x + brx, y + h - br, brx, br, 0, Math.PI / 2, Math.PI);
  p.lineTo(x, y + tr);
  p.ellipse(x + trx, y + tr, trx, tr, 0, Math.PI, Math.PI * 1.5);
  p.closePath();
}
const HEAD = new Path2D();
eRectP(HEAD, 0, 44, 240, 191, 104, 83, 56, 45);
const P2 = (d) => new Path2D(d);
const leaf = (cx, cy, rx, ry, rot) => {
  const p = new Path2D();
  p.ellipse(cx, cy, rx, ry, rot, 0, TAU);
  return p;
};
const TOPS = {
  antena: {
    pivot: [150, 60],
    shapes: [{ p: P2('M150,62 Q152,30 172,14'), w: 10 }, { p: leaf(176, 12, 15, 15, 0) }],
  },
  broto: {
    pivot: [122, 78],
    shapes: [
      { p: P2('M122,80 C122,64 121,52 118,40'), w: 11 },
      { p: leaf(98, 38, 24, 12, -0.5) },
      { p: leaf(140, 30, 26, 13, 0.45) },
    ],
  },
  cacho: {
    pivot: [128, 78],
    shapes: [
      {
        p: P2(
          'M126,80 C118,52 134,26 158,30 C176,34 174,58 156,58 C144,58 142,46 150,42',
        ),
        w: 15,
      },
    ],
  },
  tufo: {
    pivot: [120, 78],
    shapes: [
      { p: P2('M104,80 L94,50'), w: 16 },
      { p: P2('M121,78 L122,40'), w: 16 },
      { p: P2('M138,80 L150,52'), w: 16 },
    ],
  },
};
let VARIANT = 'antena';
function topPass(x, sway, pass, V) {
  x.save();
  x.translate(V.pivot[0], V.pivot[1]);
  x.rotate(sway);
  x.translate(-V.pivot[0], -V.pivot[1]);
  const ext = pass === 'fill' ? 0 : pass === 'border' ? BORDER * 2 : BORDER * 2 + 2.5;
  const col = pass === 'fill' ? LIME : pass === 'border' ? WHITE : 'rgba(0,0,0,0.07)';
  x.strokeStyle = col;
  x.fillStyle = col;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  for (const sh of V.shapes) {
    if (sh.w) {
      x.lineWidth = sh.w + ext;
      x.stroke(sh.p);
    } else {
      if (ext) {
        x.lineWidth = ext;
        x.stroke(sh.p);
      }
      x.fill(sh.p);
    }
  }
  x.restore();
}
const TOP0 = new Path2D();
eRectP(TOP0, 0, 0, 45, 56, 22.5, 31.4, 13.5, 24.6);
const topPath = (sway) => {
  const p = new Path2D();
  p.addPath(
    TOP0,
    new DOMMatrix()
      .translate(127.5, 52)
      .rotate((sway * 180) / Math.PI - 8)
      .translate(-22.5, -49),
  );
  return p;
};
const pill = (c, x, y, w, h) => {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(w, h) / 2);
  c.fill();
};
function stroke(c, pts, w, col) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
}
function stickerStroke(c, pts, w) {
  stroke(c, pts, w + 20, WHITE);
}
function badge(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = WHITE;
  c.beginPath();
  c.arc(0, 0, 41, 0, TAU);
  c.fill();
  c.fillStyle = RED;
  c.beginPath();
  c.arc(0, 0, 32, 0, TAU);
  c.fill();
  c.fillStyle = WHITE;
  c.beginPath();
  c.roundRect(-5.5, -20, 11, 25, 5.5);
  c.fill();
  c.beginPath();
  c.arc(0, 14, 6, 0, TAU);
  c.fill();
  c.restore();
}

const MOODS = {
  neutro: {
    dur: 1.8,
    still: 0,
    f(t) {
      const b = t > 0.78 && t < 0.88 ? sin(((t - 0.78) / 0.1) * Math.PI) : 0;
      return {
        sway: 0.06 * sin(TAU * t),
        dy: -3 * sin(TAU * t),
        eyes(c) {
          c.fillStyle = INK;
          const h = Math.max(10, 56 * (1 - b));
          pill(c, 65.5, 138 - h / 2, 33, h);
          pill(c, 134.5, 138 - h / 2, 33, h);
        },
      };
    },
  },
  rodando: {
    dur: 1.6,
    still: 0.25,
    f(t) {
      const ox = 22 * sin(TAU * t);
      return {
        sway: -0.14 * sin(TAU * t),
        rot: 0.025 * sin(TAU * t),
        eyes(c) {
          c.fillStyle = INK;
          pill(c, 65.5 + ox, 110, 33, 56);
          pill(c, 134.5 + ox, 110, 33, 56);
        },
      };
    },
  },
  passou: {
    dur: 1.2,
    still: 0.75,
    f(t) {
      let dy = 0,
        sx = 1,
        sy = 1;
      if (t < 0.5) {
        const u = t / 0.5;
        dy = -34 * sin(Math.PI * u);
        if (u < 0.12) {
          sy = 0.93;
          sx = 1.05;
        }
      } else if (t < 0.62) {
        const u = (t - 0.5) / 0.12;
        sy = 1 - 0.1 * sin(Math.PI * u);
        sx = 1 + 0.06 * sin(Math.PI * u);
      }
      return {
        dy,
        sx,
        sy,
        sway:
          t < 0.5 ? 0.25 * sin((Math.PI * t) / 0.5) : -0.08 * sin(TAU * (t - 0.5) * 2),
        eyes(c) {
          c.strokeStyle = INK;
          c.lineWidth = 13;
          c.lineCap = 'round';
          for (const x of [82, 151]) {
            c.beginPath();
            c.arc(x, 150, 17.5, Math.PI * 1.05, Math.PI * 1.95);
            c.stroke();
          }
        },
      };
    },
  },
  bug: {
    dur: 2.0,
    still: 0,
    f(t) {
      const look = 18 * sin(TAU * t),
        pulse = 1 + 0.12 * sin(TAU * t * 2);
      return {
        dx: 3.5 * sin(TAU * t * 10),
        sway: 0.18 * sin(TAU * t * 5),
        eyes(c) {
          c.fillStyle = INK;
          for (const x of [82, 151]) {
            c.beginPath();
            c.ellipse(x + look, 136, 24, 34, 0, 0, TAU);
            c.fill();
          }
        },
        extra(c) {
          badge(c, 228, 64, pulse, 0.15 * sin(TAU * t * 2));
        },
      };
    },
  },
  desconfiado: {
    dur: 2.0,
    still: 0.25,
    f(t) {
      const ox = 16 * sin(TAU * t);
      return {
        rot: -0.035 * sin(TAU * t),
        sway: 0.05 * sin(TAU * t),
        eyes(c) {
          c.fillStyle = INK;
          pill(c, 60 + ox, 132, 44, 13);
          pill(c, 134.5 + ox, 110, 33, 56);
        },
      };
    },
  },
  pensando: {
    dur: 2.0,
    still: 0.9,
    f(t) {
      const ox = 14 * sin(TAU * t);
      return {
        sway: 0.08 * sin(TAU * t),
        rot: 0.02 * sin(TAU * t),
        eyes(c) {
          c.fillStyle = INK;
          pill(c, 56 + ox, 90, 33, 56);
          pill(c, 125 + ox, 90, 33, 56);
        },
        extra(c) {
          const n = Math.floor(t * 4);
          [
            [62, 18],
            [34, 0],
            [6, -18],
          ].forEach(([x, y], i) => {
            if (i < n) {
              c.fillStyle = WHITE;
              c.beginPath();
              c.arc(x, y, 15, 0, TAU);
              c.fill();
              c.fillStyle = INK;
              c.beginPath();
              c.arc(x, y, 8.5, 0, TAU);
              c.fill();
            }
          });
        },
      };
    },
  },
  quebrou: {
    dur: 1.5,
    still: 0.04,
    f(t) {
      const fi = Math.floor(t * 30),
        j = fi % 3 === 0 && t < 0.5 ? 4 : 0;
      return {
        dx: j * (fi % 2 ? 1 : -1),
        rot: 0.07 * sin(TAU * t * 2) * (t < 0.5 ? 1 : 0.4),
        sway: 0.3 * sin(TAU * t * 2),
        eyes(c) {
          for (const x of [82, 151]) {
            stroke(
              c,
              [
                [x - 17, 121],
                [x + 17, 155],
              ],
              13,
              INK,
            );
            stroke(
              c,
              [
                [x + 17, 121],
                [x - 17, 155],
              ],
              13,
              INK,
            );
          }
        },
        extra(c) {
          if (t < 0.5 && fi % 4 < 2) {
            const z = [
              [226, 44],
              [244, 30],
              [234, 20],
              [256, 2],
            ];
            stickerStroke(c, z, 8);
            stroke(c, z, 8, RED);
          }
        },
      };
    },
  },
  dormindo: {
    dur: 2.88,
    still: 0.3,
    f(t) {
      const br = sin(TAU * t);
      return {
        sy: 1 + 0.035 * br,
        sx: 1 - 0.02 * br,
        sway: 0.05 * br,
        eyes(c) {
          c.fillStyle = INK;
          pill(c, 60, 144, 44, 13);
          pill(c, 129, 144, 44, 13);
        },
        extra(c) {
          for (let k = 0; k < 2; k++) {
            const u = (t + k * 0.5) % 1;
            const a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
            const s = 18 + 12 * u,
              x = 214 + 22 * u,
              y = 46 - 56 * u;
            const z = [
              [x, y],
              [x + s, y],
              [x, y + s],
              [x + s, y + s],
            ];
            c.globalAlpha = Math.max(0, Math.min(1, a));
            stickerStroke(c, z, 6);
            stroke(c, z, 6, INK);
            c.globalAlpha = 1;
          }
        },
      };
    },
  },
};

const _layers = new Map();
function scratch(size) {
  let o = _layers.get(size);
  if (!o) {
    o = document.createElement('canvas');
    o.width = o.height = size;
    _layers.set(size, o);
  }
  return o;
}

// Sticker character on transparent square canvas (figure fits in 340 units)
function drawSticker(c, size, mood, t, opt = {}) {
  const base = opt.rot ?? -6,
    p = MOODS[mood].f(t),
    pad = opt.pad || 0,
    S = size / (340 + 2 * pad);
  const L = scratch(size),
    x = L.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, size, size);
  x.setTransform(
    new DOMMatrix()
      .translate((170 + pad + (p.dx || 0)) * S, (292 + pad + (p.dy || 0)) * S)
      .rotate(base + ((p.rot || 0) * 180) / Math.PI)
      .scale((p.sx || 1) * S, (p.sy || 1) * S)
      .translate(-120, -235),
  );
  const V = TOPS[opt.variant || VARIANT],
    sw = (p.sway || 0) * 1.4;
  x.lineJoin = 'round';
  x.strokeStyle = 'rgba(0,0,0,0.07)';
  x.lineWidth = BORDER * 2 + 2.5;
  x.stroke(HEAD);
  topPass(x, sw, 'shadow', V);
  x.strokeStyle = WHITE;
  x.lineWidth = BORDER * 2;
  x.stroke(HEAD);
  x.fillStyle = WHITE;
  x.fill(HEAD);
  topPass(x, sw, 'border', V);
  x.fillStyle = LIME;
  x.fill(HEAD);
  topPass(x, sw, 'fill', V);
  x.save();
  x.clip(HEAD);
  const g = x.createLinearGradient(0, 160, 0, 235);
  g.addColorStop(0, 'rgba(90,130,0,0)');
  g.addColorStop(1, 'rgba(90,130,0,0.10)');
  x.fillStyle = g;
  x.fillRect(-20, 150, 290, 90);
  x.restore();
  x.fillStyle = 'rgba(255,255,255,0.5)';
  x.beginPath();
  x.ellipse(50, 98, 24, 7.5, -0.62, 0, TAU);
  x.fill();
  x.beginPath();
  x.arc(80, 72, 4.5, 0, TAU);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,.6)';
  x.save();
  x.translate(150, 60);
  x.rotate(sw);
  x.translate(-150, -60);
  x.beginPath();
  x.arc(171, 7, 4, 0, TAU);
  x.fill();
  x.restore();
  p.eyes(x);
  if (p.extra) p.extra(x);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (!opt.keep) c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  const ox = opt.x ?? 0,
    oy = opt.y ?? 0;
  c.shadowColor = opt.shadow || 'rgba(26,14,80,0.26)';
  c.shadowBlur = 22 * S;
  c.shadowOffsetY = 11 * S;
  c.drawImage(L, ox, oy);
  c.shadowColor = 'rgba(0,0,0,0.16)';
  c.shadowBlur = 3 * S;
  c.shadowOffsetY = 2 * S;
  c.drawImage(L, ox, oy);
  c.restore();
}

function SQ(X, Y, S, n = 5) {
  const p = new Path2D(),
    a = S / 2,
    cx = X + a,
    cy = Y + a;
  for (let i = 0; i <= 360; i++) {
    const t = (i / 360) * TAU,
      ct = Math.cos(t),
      st = Math.sin(t);
    const x = cx + a * Math.sign(ct) * Math.abs(ct) ** (2 / n),
      y = cy + a * Math.sign(st) * Math.abs(st) ** (2 / n);
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  p.closePath();
  return p;
}
const TILES = {
  indigo: ['#6A4DFF', '#3D20C4', 'rgba(26,14,80,0.32)'],
  noite: ['#34363D', '#141518', 'rgba(0,0,0,0.45)'],
  papel: ['#FBF9F3', '#E4DFD1', 'rgba(60,50,30,0.22)'],
};
function drawIcon1024(c, key, mood = 'neutro', variant) {
  const [a, b, sh] = TILES[key],
    T = SQ(100, 100, 824);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, 1024, 1024);
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.25)';
  c.shadowBlur = 20;
  c.shadowOffsetY = 8;
  c.fillStyle = b;
  c.fill(T);
  c.restore();
  const g = c.createLinearGradient(260, 100, 764, 924);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  c.fillStyle = g;
  c.fill(T);
  c.save();
  c.clip(T);
  const hl = c.createLinearGradient(0, 100, 0, 420);
  hl.addColorStop(0, 'rgba(255,255,255,0.10)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hl;
  c.fillRect(100, 100, 824, 320);
  const o = document.createElement('canvas');
  o.width = o.height = 1024;
  const ox = o.getContext('2d');
  drawSticker(ox, 1024, mood, MOODS[mood].still, {
    rot: -4,
    shadow: sh,
    pad: 20,
    variant,
  });
  const d = ox.getImageData(0, 0, 1024, 1024).data;
  let x0 = 1024,
    y0 = 1024,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < 1024; y += 2)
    for (let x = 0; x < 1024; x += 2)
      if (d[(y * 1024 + x) * 4 + 3] > 230) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  const k = 600 / Math.max(x1 - x0, y1 - y0),
    cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2;
  c.drawImage(o, 512 - cx * k, 516 - cy * k, 1024 * k, 1024 * k);
  c.lineWidth = 3;
  c.strokeStyle = 'rgba(255,255,255,0.12)';
  c.stroke(T);
  c.restore();
}
function downscale(src, size) {
  let cur = src;
  while (cur.width / 2 >= size) {
    const n = document.createElement('canvas');
    n.width = n.height = cur.width / 2;
    const x = n.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(cur, 0, 0, n.width, n.height);
    cur = n;
  }
  if (cur.width !== size) {
    const n = document.createElement('canvas');
    n.width = n.height = size;
    const x = n.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(cur, 0, 0, size, size);
    cur = n;
  }
  return cur;
}

// Wordmark sticker: QAzinho with white die-cut border
function drawWord(c, x, y, fs, rot = 0, opt = {}) {
  c.save();
  c.translate(x, y);
  c.rotate((rot * Math.PI) / 180);
  c.font = `800 ${fs}px 'Bricolage Grotesque'`;
  c.letterSpacing = `${-fs * 0.04}px`;
  c.textBaseline = 'alphabetic';
  c.lineJoin = 'round';
  const L = document.createElement('canvas'),
    w = Math.ceil(c.measureText('QAzinho').width + fs),
    h = Math.ceil(fs * 1.6);
  L.width = w;
  L.height = h;
  const x2 = L.getContext('2d');
  x2.font = c.font;
  x2.letterSpacing = c.letterSpacing;
  x2.lineJoin = 'round';
  const bx = fs * 0.5,
    by = fs * 1.12;
  x2.strokeStyle = WHITE;
  x2.lineWidth = fs * 0.26;
  x2.strokeText('QAzinho', bx, by);
  x2.fillStyle = WHITE;
  x2.fillText('QAzinho', bx, by);
  x2.fillStyle = opt.ink || INK;
  x2.fillText('QAzinho', bx, by);
  c.shadowColor = 'rgba(26,14,80,0.26)';
  c.shadowBlur = fs * 0.12;
  c.shadowOffsetY = fs * 0.06;
  c.drawImage(L, -bx, -by);
  c.shadowColor = 'rgba(0,0,0,0.16)';
  c.shadowBlur = fs * 0.015;
  c.shadowOffsetY = fs * 0.01;
  c.drawImage(L, -bx, -by);
  c.restore();
  return w - fs;
}
function drawTag(c, x, y, text, fs, rot = 0, bg = INK, fg = LIME) {
  c.save();
  c.translate(x, y);
  c.rotate((rot * Math.PI) / 180);
  c.font = `700 ${fs}px 'JetBrains Mono'`;
  c.letterSpacing = `${fs * 0.18}px`;
  const tw = c.measureText(text).width,
    px = fs * 0.9,
    h = fs * 2.1,
    w = tw + px * 2;
  c.shadowColor = 'rgba(26,14,80,0.24)';
  c.shadowBlur = fs * 0.5;
  c.shadowOffsetY = fs * 0.25;
  c.fillStyle = WHITE;
  c.beginPath();
  c.roundRect(-fs * 0.32, -fs * 0.32, w + fs * 0.64, h + fs * 0.64, (h + fs * 0.64) / 2);
  c.fill();
  c.shadowColor = 'transparent';
  c.fillStyle = bg;
  c.beginPath();
  c.roundRect(0, 0, w, h, h / 2);
  c.fill();
  c.fillStyle = fg;
  c.textBaseline = 'middle';
  c.fillText(text, px, h / 2 + fs * 0.05);
  c.restore();
}
async function loadFonts() {
  const css = await (
    await fetch(
      'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@96,800&family=JetBrains+Mono:wght@700',
    )
  ).text();
  for (const [, fam, w, u] of css.matchAll(
    /font-family: '([^']+)';[\s\S]*?font-weight: (\d+);[\s\S]*?src: url\(([^)]+)\)/g,
  )) {
    const f = new FontFace(fam, `url(${u})`, { weight: w });
    await f.load();
    document.fonts.add(f);
  }
}
