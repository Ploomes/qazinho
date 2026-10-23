import type { InternMood } from '@/shared/components/atoms/Intern/types';

const TAU = Math.PI * 2;
const LIME = '#c6f432';
const INK = '#141414';
const RED = '#ff4d2e';
const WHITE = '#ffffff';
const EDGE = 13;
const TILT = (-6 * Math.PI) / 180;
const FRAME = { stage: { span: 340, foot: 0.86 }, figure: { span: 300, foot: 0.893 } };
const FOOT = { x: 120, y: 235 };
const ANTENNA = {
  pivot: [150, 60],
  stalk: [150, 62, 152, 30, 172, 14],
  width: 10,
  tip: [176, 12, 15],
} as const;
const SWAY = 1.4;

type Pose = {
  sway?: number;
  dx?: number;
  dy?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  eyes: (c: CanvasRenderingContext2D) => void;
  extra?: (c: CanvasRenderingContext2D, isSticker: boolean) => void;
};

function pill(c: CanvasRenderingContext2D, box: [number, number, number, number]): void {
  const [x, y, w, h] = box;

  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(w, h) / 2);
  c.fill();
}

function traceBox(
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
}

function traceHead(c: CanvasRenderingContext2D): void {
  traceBox(c, { x: 0, y: 44, w: 240, h: 191, top: [104, 83], bottom: [56, 45] });
}

function antenna(
  c: CanvasRenderingContext2D,
  pass: { sway: number; colour: string; spread: number },
): void {
  const [px, py] = ANTENNA.pivot;
  const [x0, y0, cx, cy, x1, y1] = ANTENNA.stalk;
  const [tx, ty, tr] = ANTENNA.tip;

  c.save();
  c.translate(px, py);
  c.rotate(pass.sway);
  c.translate(-px, -py);
  c.strokeStyle = pass.colour;
  c.fillStyle = pass.colour;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = ANTENNA.width + pass.spread;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo(cx, cy, x1, y1);
  c.stroke();
  c.beginPath();
  c.arc(tx, ty, tr, 0, TAU);

  if (pass.spread > 0) {
    c.lineWidth = pass.spread;
    c.stroke();
  }

  c.fill();
  c.restore();
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

function stickerLine(
  c: CanvasRenderingContext2D,
  line: { points: number[][]; width: number; colour: string; isSticker: boolean },
): void {
  if (line.isSticker) stroke(c, { ...line, width: line.width + 20, colour: WHITE });

  stroke(c, line);
}

function dot(
  c: CanvasRenderingContext2D,
  circle: { x: number; y: number; r: number },
): void {
  c.beginPath();
  c.arc(circle.x, circle.y, circle.r, 0, TAU);
  c.fill();
}

function badge(
  c: CanvasRenderingContext2D,
  place: { pulse: number; turn: number },
): void {
  c.save();
  c.translate(228, 64);
  c.rotate(place.turn);
  c.scale(place.pulse, place.pulse);
  c.fillStyle = WHITE;
  dot(c, { x: 0, y: 0, r: 41 });
  c.fillStyle = RED;
  dot(c, { x: 0, y: 0, r: 32 });
  c.fillStyle = WHITE;
  c.beginPath();
  c.roundRect(-5.5, -20, 11, 25, 5.5);
  c.fill();
  dot(c, { x: 0, y: 14, r: 6 });
  c.restore();
}

const POSES: Record<InternMood, (t: number) => Pose> = {
  neutral: (t) => {
    const blink = t > 0.78 && t < 0.88 ? Math.sin(((t - 0.78) / 0.1) * Math.PI) : 0;
    const h = Math.max(10, 56 * (1 - blink));

    return {
      sway: 0.06 * Math.sin(TAU * t),
      dy: -3 * Math.sin(TAU * t),
      eyes: (c) => {
        c.fillStyle = INK;
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
        c.fillStyle = INK;
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
  bug: (t) => {
    const look = 18 * Math.sin(TAU * t);

    return {
      dx: 3.5 * Math.sin(TAU * t * 10),
      sway: 0.18 * Math.sin(TAU * t * 5),
      eyes: (c) => {
        c.fillStyle = INK;
        for (const x of [82, 151]) {
          c.beginPath();
          c.ellipse(x + look, 136, 24, 34, 0, 0, TAU);
          c.fill();
        }
      },
      extra: (c) => {
        badge(c, {
          pulse: 1 + 0.12 * Math.sin(TAU * t * 2),
          turn: 0.15 * Math.sin(TAU * t * 2),
        });
      },
    };
  },
  flaky: (t) => {
    const ox = 16 * Math.sin(TAU * t);

    return {
      rot: -0.035 * Math.sin(TAU * t),
      sway: 0.05 * Math.sin(TAU * t),
      eyes: (c) => {
        c.fillStyle = INK;
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
        c.fillStyle = INK;
        pill(c, [56 + ox, 90, 33, 56]);
        pill(c, [125 + ox, 90, 33, 56]);
      },
      extra: (c) => {
        [
          [62, 18],
          [34, 0],
          [6, -18],
        ].forEach(([x = 0, y = 0], index) => {
          if (index >= dots) return;
          c.fillStyle = WHITE;
          dot(c, { x, y, r: 15 });
          c.fillStyle = INK;
          dot(c, { x, y, r: 8.5 });
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
            colour: INK,
          });
          stroke(c, {
            points: [
              [x + 17, 121],
              [x - 17, 155],
            ],
            width: 13,
            colour: INK,
          });
        }
      },
      extra: (c, isSticker) => {
        if (t < 0.5 && frame % 4 < 2)
          stickerLine(c, {
            isSticker,
            points: [
              [226, 44],
              [244, 30],
              [234, 20],
              [256, 2],
            ],
            width: 8,
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
        c.fillStyle = INK;
        pill(c, [60, 144, 44, 13]);
        pill(c, [129, 144, 44, 13]);
      },
      extra: (c, isSticker) => {
        for (let k = 0; k < 2; k += 1) {
          const u = (t + k * 0.5) % 1;
          const fade = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
          const s = 18 + 12 * u;
          const x = 214 + 22 * u;
          const y = 46 - 56 * u;

          c.globalAlpha = Math.max(0, Math.min(1, fade));
          stickerLine(c, {
            isSticker,
            points: [
              [x, y],
              [x + s, y],
              [x, y + s],
              [x + s, y + s],
            ],
            width: 6,
            colour: INK,
          });
          c.globalAlpha = 1;
        }
      },
    };
  },
};

/** Draws the Estagiário, his antenna swaying, in a mood at phase `t` (0 to 1) on `layer`, then lays him on `context`: flat and upright, or as the logo's sticker when `sticker` names its shadow. */
export function drawIntern(props: {
  context: CanvasRenderingContext2D;
  layer: CanvasRenderingContext2D;
  size: number;
  mood: InternMood;
  t: number;
  isFigure: boolean;
  sticker: string | null;
}): void {
  const { context: c, layer: l, size, mood, t } = props;
  const pose = POSES[mood](t);
  const frame = props.isFigure ? FRAME.figure : FRAME.stage;
  const unit = size / frame.span;

  l.setTransform(1, 0, 0, 1, 0, 0);
  l.clearRect(0, 0, size, size);
  l.globalAlpha = 1;
  l.translate(
    (frame.span / 2 + (pose.dx ?? 0)) * unit,
    (frame.span * frame.foot + (pose.dy ?? 0)) * unit,
  );
  l.rotate((props.sticker === null ? 0 : TILT) + (pose.rot ?? 0));
  l.scale((pose.sx ?? 1) * unit, (pose.sy ?? 1) * unit);
  l.translate(-FOOT.x, -FOOT.y);

  const sway = (pose.sway ?? 0) * SWAY;
  const isSticker = props.sticker !== null;

  if (isSticker) {
    l.lineJoin = 'round';
    l.beginPath();
    traceHead(l);
    l.strokeStyle = 'rgba(0, 0, 0, 0.07)';
    l.lineWidth = EDGE * 2 + 2.5;
    l.stroke();
    antenna(l, { sway, colour: 'rgba(0, 0, 0, 0.07)', spread: EDGE * 2 + 2.5 });
    l.beginPath();
    traceHead(l);
    l.strokeStyle = WHITE;
    l.lineWidth = EDGE * 2;
    l.stroke();
    l.fillStyle = WHITE;
    l.fill();
    antenna(l, { sway, colour: WHITE, spread: EDGE * 2 });
  }

  l.beginPath();
  traceHead(l);
  l.fillStyle = LIME;
  l.fill();
  antenna(l, { sway, colour: LIME, spread: 0 });

  l.save();
  l.beginPath();
  traceHead(l);
  l.clip();

  const shade = l.createLinearGradient(0, 160, 0, 235);

  shade.addColorStop(0, 'rgba(90, 130, 0, 0)');
  shade.addColorStop(1, 'rgba(90, 130, 0, 0.1)');
  l.fillStyle = shade;
  l.fillRect(0, 150, 240, 90);
  l.restore();

  if (isSticker) {
    const [px, py] = ANTENNA.pivot;

    l.fillStyle = 'rgba(255, 255, 255, 0.5)';
    l.beginPath();
    l.ellipse(50, 98, 24, 7.5, -0.62, 0, TAU);
    l.fill();
    dot(l, { x: 80, y: 72, r: 4.5 });
    l.save();
    l.translate(px, py);
    l.rotate(sway);
    l.translate(-px, -py);
    l.fillStyle = 'rgba(255, 255, 255, 0.6)';
    dot(l, { x: 171, y: 7, r: 4 });
    l.restore();
  }

  pose.eyes(l);
  pose.extra?.(l, isSticker);

  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, size, size);

  if (props.sticker === null) {
    c.drawImage(l.canvas, 0, 0);

    return;
  }

  c.save();
  c.shadowColor = props.sticker;
  c.shadowBlur = 22 * unit;
  c.shadowOffsetY = 11 * unit;
  c.drawImage(l.canvas, 0, 0);
  c.shadowColor = 'rgba(0, 0, 0, 0.16)';
  c.shadowBlur = 3 * unit;
  c.shadowOffsetY = 2 * unit;
  c.drawImage(l.canvas, 0, 0);
  c.restore();
}
