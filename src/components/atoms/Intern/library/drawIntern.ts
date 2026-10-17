import type { InternMood } from '@/components/atoms/Intern/types';

// Ported from the designer's assets/animations/estagiario-anim.js. Base units: the figure is
// 240 × 235 with the head's top at y = 44; the stage around it is 320 × 320.
const TAU = Math.PI * 2;
const LIME = '#c6f432';
const DARK = '#141414';
const RED = '#ff4d2e';
const STAGE = 320;
const FIGURE = { width: 240, height: 235 };

type Pose = {
  sway?: number;
  dx?: number;
  dy?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  eyes: (c: CanvasRenderingContext2D) => void;
  extra?: (c: CanvasRenderingContext2D, mark: string) => void;
};

function pill(c: CanvasRenderingContext2D, box: [number, number, number, number]): void {
  const [x, y, w, h] = box;

  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(w, h) / 2);
  c.fill();
}

// A rectangle whose four corners are quarter ellipses: the head and the sprout.
function roundBox(
  c: CanvasRenderingContext2D,
  shape: {
    x: number;
    y: number;
    w: number;
    h: number;
    top: [number, number];
    bottom: [number, number];
  },
): void {
  const { x, y, w, h } = shape;
  const [trx, tr] = shape.top;
  const [brx, br] = shape.bottom;

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

function head(c: CanvasRenderingContext2D, sway: number): void {
  c.fillStyle = LIME;
  c.save();
  c.translate(127.5, 52);
  c.rotate(sway - (8 * Math.PI) / 180);
  c.translate(-22.5, -49);
  roundBox(c, { x: 0, y: 0, w: 45, h: 56, top: [22.5, 31.4], bottom: [13.5, 24.6] });
  c.restore();
  roundBox(c, { x: 0, y: 44, w: 240, h: 191, top: [104, 83], bottom: [56, 45] });
}

function stroke(
  c: CanvasRenderingContext2D,
  line: { points: number[][]; width: number; colour: string },
): void {
  c.strokeStyle = line.colour;
  c.lineWidth = line.width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  line.points.forEach(([x = 0, y = 0], index) => {
    if (index === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  });
  c.stroke();
}

const POSES: Record<InternMood, (t: number) => Pose> = {
  neutral: (t) => {
    const blink = t > 0.78 && t < 0.88 ? Math.sin(((t - 0.78) / 0.1) * Math.PI) : 0;
    const h = Math.max(10, 56 * (1 - blink));

    return {
      sway: 0.06 * Math.sin(TAU * t),
      dy: -3 * Math.sin(TAU * t),
      eyes: (c) => {
        c.fillStyle = DARK;
        pill(c, [65.5, 138 - h / 2, 33, h]);
        pill(c, [134.5, 138 - h / 2, 33, h]);
      },
    };
  },
  running: (t) => {
    const ox = 22 * Math.sin(TAU * t);

    return {
      sway: -0.14 * Math.sin(TAU * t),
      rot: 0.025 * Math.sin(TAU * t),
      eyes: (c) => {
        c.fillStyle = DARK;
        pill(c, [65.5 + ox, 110, 33, 56]);
        pill(c, [134.5 + ox, 110, 33, 56]);
      },
    };
  },
  passed: (t) => {
    let dy = 0;
    let sx = 1;
    let sy = 1;

    if (t < 0.5) {
      const u = t / 0.5;

      dy = -34 * Math.sin(Math.PI * u);
      if (u < 0.12) {
        sy = 0.93;
        sx = 1.05;
      }
    } else if (t < 0.62) {
      const u = (t - 0.5) / 0.12;

      sy = 1 - 0.1 * Math.sin(Math.PI * u);
      sx = 1 + 0.06 * Math.sin(Math.PI * u);
    }

    return {
      dy,
      sx,
      sy,
      sway:
        t < 0.5
          ? 0.25 * Math.sin((Math.PI * t) / 0.5)
          : -0.08 * Math.sin(TAU * (t - 0.5) * 2),
      eyes: (c) => {
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
  bug: (t) => {
    const look = 18 * Math.sin(TAU * t);
    const pulse = 1 + 0.12 * Math.sin(TAU * t * 2);

    return {
      dx: 3.5 * Math.sin(TAU * t * 10),
      sway: 0.18 * Math.sin(TAU * t * 5),
      eyes: (c) => {
        c.fillStyle = DARK;
        for (const x of [82, 151]) {
          c.beginPath();
          c.ellipse(x + look, 136, 24, 34, 0, 0, TAU);
          c.fill();
        }
      },
      extra: (c) => {
        c.save();
        c.translate(230, 62);
        c.scale(pulse, pulse);
        c.rotate(0.15 * Math.sin(TAU * t * 2));
        c.fillStyle = RED;
        c.beginPath();
        c.arc(0, 0, 32, 0, TAU);
        c.fill();
        c.fillStyle = '#fff';
        pill(c, [-5, -19, 10, 24]);
        c.beginPath();
        c.arc(0, 14, 5.5, 0, TAU);
        c.fill();
        c.restore();
      },
    };
  },
  flaky: (t) => {
    const ox = 16 * Math.sin(TAU * t);

    return {
      rot: -0.035 * Math.sin(TAU * t),
      sway: 0.05 * Math.sin(TAU * t),
      eyes: (c) => {
        c.fillStyle = DARK;
        pill(c, [60 + ox, 132, 44, 13]);
        pill(c, [134.5 + ox, 110, 33, 56]);
      },
    };
  },
  thinking: (t) => {
    const ox = 14 * Math.sin(TAU * t);
    const dots = Math.floor(t * 4);

    return {
      sway: 0.08 * Math.sin(TAU * t),
      rot: 0.02 * Math.sin(TAU * t),
      eyes: (c) => {
        c.fillStyle = DARK;
        pill(c, [56 + ox, 90, 33, 56]);
        pill(c, [125 + ox, 90, 33, 56]);
      },
      extra: (c, mark) => {
        c.fillStyle = mark;
        [196, 222, 248].forEach((x, index) => {
          if (index >= dots) return;
          c.beginPath();
          c.arc(x, 14, 8, 0, TAU);
          c.fill();
        });
      },
    };
  },
  broken: (t) => {
    const frame = Math.floor(t * 30);
    const jolt = frame % 3 === 0 && t < 0.5 ? 4 : 0;

    return {
      dx: jolt * (frame % 2 ? 1 : -1),
      rot: 0.07 * Math.sin(TAU * t * 2) * (t < 0.5 ? 1 : 0.4),
      sway: 0.3 * Math.sin(TAU * t * 2),
      eyes: (c) => {
        for (const x of [82, 151]) {
          stroke(c, {
            points: [
              [x - 17, 121],
              [x + 17, 155],
            ],
            width: 13,
            colour: DARK,
          });
          stroke(c, {
            points: [
              [x + 17, 121],
              [x - 17, 155],
            ],
            width: 13,
            colour: DARK,
          });
        }
      },
      extra: (c) => {
        if (t < 0.5 && frame % 4 < 2)
          stroke(c, {
            points: [
              [230, 40],
              [244, 30],
              [236, 22],
              [252, 8],
            ],
            width: 7,
            colour: RED,
          });
      },
    };
  },
  sleeping: (t) => {
    const breath = Math.sin(TAU * t);

    return {
      sy: 1 + 0.035 * breath,
      sx: 1 - 0.02 * breath,
      sway: 0.05 * breath,
      eyes: (c) => {
        c.fillStyle = DARK;
        pill(c, [60, 144, 44, 13]);
        pill(c, [129, 144, 44, 13]);
      },
      extra: (c, mark) => {
        for (let k = 0; k < 2; k += 1) {
          const u = (t + k * 0.5) % 1;
          const fade = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
          const s = 18 + 14 * u;
          const x = 205 + 24 * u;
          const y = 40 - 70 * u;

          c.globalAlpha = Math.max(0, Math.min(1, fade));
          stroke(c, {
            points: [
              [x, y],
              [x + s, y],
              [x, y + s],
              [x + s, y + s],
            ],
            width: 6,
            colour: mark,
          });
          c.globalAlpha = 1;
        }
      },
    };
  },
};

/** Draws the Estagiário in a mood at phase `t` (0 to 1) on a square canvas of `size` pixels. */
export function drawIntern(props: {
  context: CanvasRenderingContext2D;
  size: number;
  mood: InternMood;
  t: number;
  mark: string;
  isFigure: boolean;
}): void {
  const { context: c, size, mood, t, mark, isFigure } = props;
  const pose = POSES[mood](t);
  // The stage leaves room for a z or a badge; the figure alone fills the square, for a logo.
  const scale = isFigure ? size / FIGURE.width : size / STAGE;
  const footX = isFigure ? size / 2 : 160 * scale;
  const footY = isFigure
    ? (size + FIGURE.height * scale) / 2
    : (40 + FIGURE.height) * scale;

  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, size, size);
  c.globalAlpha = 1;
  c.translate(footX + (pose.dx ?? 0) * scale, footY + (pose.dy ?? 0) * scale);
  c.rotate(pose.rot ?? 0);
  c.scale((pose.sx ?? 1) * scale, (pose.sy ?? 1) * scale);
  c.translate(-FIGURE.width / 2, -FIGURE.height);
  head(c, pose.sway ?? 0);
  pose.eyes(c);
  pose.extra?.(c, mark);
}
