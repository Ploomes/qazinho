// Estagiário — mood animations (base units: figure 240x235, head top at y=44)
const TAU = Math.PI * 2,
  sin = Math.sin;
const LIME = '#c6f432',
  DARK = '#141414',
  RED = '#ff4d2e';
function pill(c, x, y, w, h) {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(w, h) / 2);
  c.fill();
}
function eRect(c, x, y, w, h, trx, tr, brx, br) {
  c.beginPath();
  c.moveTo(x + trx, y);
  c.lineTo(x + w - trx, y);
  c.ellipse(x + w - trx, y + tr, trx, tr, 0, -Math.PI / 2, 0);
  c.lineTo(x + w, y + h - br);
  c.ellipse(x + w - brx, y + h - br, brx, br, 0, 0, Math.PI / 2);
  c.lineTo(x + brx, y + h);
  c.ellipse(x + brx, y + h - br, brx, br, 0, Math.PI / 2, Math.PI);
  c.lineTo(x, y + tr);
  c.ellipse(x + trx, y + tr, trx, tr, 0, Math.PI, Math.PI * 1.5);
  c.closePath();
  c.fill();
}
function body(c, sway) {
  c.fillStyle = LIME;
  c.save();
  c.translate(127.5, 52);
  c.rotate(sway - (8 * Math.PI) / 180);
  c.translate(-22.5, -49);
  eRect(c, 0, 0, 45, 56, 22.5, 31.4, 13.5, 24.6);
  c.restore();
  eRect(c, 0, 44, 240, 191, 104, 83, 56, 45);
}
function line(c, pts, w, col) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
}

const MOODS = {
  neutro: {
    dur: 1.8,
    f(t) {
      const b = t > 0.78 && t < 0.88 ? sin(((t - 0.78) / 0.1) * Math.PI) : 0;
      return {
        sway: 0.06 * sin(TAU * t),
        dy: -3 * sin(TAU * t),
        eyes(c) {
          c.fillStyle = DARK;
          const h = Math.max(10, 56 * (1 - b));
          pill(c, 65.5, 138 - h / 2, 33, h);
          pill(c, 134.5, 138 - h / 2, 33, h);
        },
      };
    },
  },
  rodando: {
    dur: 1.6,
    f(t) {
      const ox = 22 * sin(TAU * t);
      return {
        sway: -0.14 * sin(TAU * t),
        rot: 0.025 * sin(TAU * t),
        eyes(c) {
          c.fillStyle = DARK;
          pill(c, 65.5 + ox, 110, 33, 56);
          pill(c, 134.5 + ox, 110, 33, 56);
        },
      };
    },
  },
  passou: {
    dur: 1.2,
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
          c.strokeStyle = DARK;
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
    f(t) {
      const look = 18 * sin(TAU * t),
        pulse = 1 + 0.12 * sin(TAU * t * 2);
      return {
        dx: 3.5 * sin(TAU * t * 10),
        sway: 0.18 * sin(TAU * t * 5),
        eyes(c) {
          c.fillStyle = DARK;
          for (const x of [82, 151]) {
            c.beginPath();
            c.ellipse(x + look, 136, 24, 34, 0, 0, TAU);
            c.fill();
          }
        },
        extra(c) {
          c.save();
          c.translate(230, 62);
          c.scale(pulse, pulse);
          c.rotate(0.15 * sin(TAU * t * 2));
          c.fillStyle = RED;
          c.beginPath();
          c.arc(0, 0, 32, 0, TAU);
          c.fill();
          c.fillStyle = '#fff';
          pill(c, -5, -19, 10, 24);
          c.beginPath();
          c.arc(0, 14, 5.5, 0, TAU);
          c.fill();
          c.restore();
        },
      };
    },
  },
  desconfiado: {
    dur: 2.0,
    f(t) {
      const ox = 16 * sin(TAU * t);
      return {
        rot: -0.035 * sin(TAU * t),
        sway: 0.05 * sin(TAU * t),
        eyes(c) {
          c.fillStyle = DARK;
          pill(c, 60 + ox, 132, 44, 13);
          pill(c, 134.5 + ox, 110, 33, 56);
        },
      };
    },
  },
  pensando: {
    dur: 2.0,
    f(t) {
      const ox = 14 * sin(TAU * t);
      return {
        sway: 0.08 * sin(TAU * t),
        rot: 0.02 * sin(TAU * t),
        eyes(c) {
          c.fillStyle = DARK;
          pill(c, 56 + ox, 90, 33, 56);
          pill(c, 125 + ox, 90, 33, 56);
        },
        extra(c) {
          const n = Math.floor(t * 4);
          c.fillStyle = DARK;
          [196, 222, 248].forEach((x, i) => {
            if (i < n) {
              c.beginPath();
              c.arc(x, 14, 8, 0, TAU);
              c.fill();
            }
          });
        },
      };
    },
  },
  quebrou: {
    dur: 1.5,
    f(t) {
      const fi = Math.floor(t * 30),
        j = fi % 3 === 0 && t < 0.5 ? 4 : 0;
      return {
        dx: j * (fi % 2 ? 1 : -1),
        rot: 0.07 * sin(TAU * t * 2) * (t < 0.5 ? 1 : 0.4),
        sway: 0.3 * sin(TAU * t * 2),
        eyes(c) {
          for (const x of [82, 151]) {
            line(
              c,
              [
                [x - 17, 121],
                [x + 17, 155],
              ],
              13,
              DARK,
            );
            line(
              c,
              [
                [x + 17, 121],
                [x - 17, 155],
              ],
              13,
              DARK,
            );
          }
        },
        extra(c) {
          if (t < 0.5 && fi % 4 < 2)
            line(
              c,
              [
                [230, 40],
                [244, 30],
                [236, 22],
                [252, 8],
              ],
              7,
              RED,
            );
        },
      };
    },
  },
  dormindo: {
    dur: 2.88,
    f(t) {
      const br = sin(TAU * t);
      return {
        sy: 1 + 0.035 * br,
        sx: 1 - 0.02 * br,
        sway: 0.05 * br,
        eyes(c) {
          c.fillStyle = DARK;
          pill(c, 60, 144, 44, 13);
          pill(c, 129, 144, 44, 13);
        },
        extra(c) {
          for (let k = 0; k < 2; k++) {
            const u = (t + k * 0.5) % 1;
            const a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
            const s = 18 + 14 * u,
              x = 205 + 24 * u,
              y = 40 - 70 * u;
            c.globalAlpha = Math.max(0, Math.min(1, a));
            line(
              c,
              [
                [x, y],
                [x + s, y],
                [x, y + s],
                [x + s, y + s],
              ],
              6,
              DARK,
            );
            c.globalAlpha = 1;
          }
        },
      };
    },
  },
};

// Draws mood at phase t (0..1) on a transparent square canvas of size `size`.
function drawMood(c, size, mood, t) {
  const p = MOODS[mood].f(t),
    S = size / 320;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, size, size);
  c.globalAlpha = 1;
  c.translate((160 + (p.dx || 0)) * S, (40 + 235 + (p.dy || 0)) * S);
  c.rotate(p.rot || 0);
  c.scale((p.sx || 1) * S, (p.sy || 1) * S);
  c.translate(-120, -235);
  body(c, p.sway || 0);
  p.eyes(c);
  if (p.extra) p.extra(c);
}
