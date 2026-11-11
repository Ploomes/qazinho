import type { InternMood } from '@/shared/components/atoms/Intern/types';
import { INTERN_SQUIRCLE } from '@/shared/components/atoms/Intern/constants/INTERN_SQUIRCLE';

type Matrix = readonly [number, number, number, number, number, number];

type Body = { dx?: number; dy?: number; rot?: number; sx?: number; sy?: number };

type Pose = {
  body: (t: number) => Body;
  eyes: (c: CanvasRenderingContext2D, at: { t: number; cy: number }) => void;
  extra?: (c: CanvasRenderingContext2D, at: { t: number; ink: string }) => void;
  sweep?: boolean;
};

const TAU = Math.PI * 2;

const SIGNAL = '#ffd23f';

const EYE = { width: 124, height: 192, radius: 46, left: 412, right: 612 };

const BODY = { x: 182, y: 330, width: 660, height: 430, inset: 30 };

const BOTTOM = BODY.y + BODY.height;

const PUPIL_Y = BODY.y + BODY.height / 2 + 4;

const FRAMES = {
  stage: { x: 0, y: 0, side: 1024 },
  figure: { x: 88, y: 100, side: 840 },
  icon: { x: 80, y: 80, side: 864 },
} as const;

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

const POSES: Record<InternMood, Pose> = {
  neutral: {
    body: (t) => ({ dy: -10 * Math.sin(TAU * t), rot: 0.012 * Math.sin(TAU * t) }),
    eyes(c, { t, cy }) {
      const blink = t > 0.78 && t < 0.88 ? Math.sin(((t - 0.78) / 0.1) * Math.PI) : 0;
      const h = Math.max(24, EYE.height * (1 - blink));

      pill(c, { cx: EYE.left, cy, w: EYE.width, h });
      pill(c, { cx: EYE.right, cy, w: EYE.width, h });
    },
  },
  running: {
    sweep: true,
    body: (t) => ({ rot: 0.03 * Math.sin(TAU * t), dx: 6 * Math.sin(TAU * t) }),
    eyes(c, { t, cy }) {
      const ox = 46 * Math.sin(TAU * t);

      pill(c, { cx: EYE.left + ox, cy, w: EYE.width - 8, h: EYE.height });
      pill(c, { cx: EYE.right + ox, cy, w: EYE.width - 8, h: EYE.height });
    },
  },
  passed: {
    body(t) {
      if (t < 0.5) {
        const u = t / 0.5;
        const squash = u < 0.12;

        return {
          dy: -96 * Math.sin(Math.PI * u),
          sx: squash ? 1.06 : 1,
          sy: squash ? 0.92 : 1,
          rot: -0.04 * Math.sin((Math.PI * t) / 0.5),
        };
      }

      if (t < 0.62) {
        const u = (t - 0.5) / 0.12;

        return {
          sy: 1 - 0.1 * Math.sin(Math.PI * u),
          sx: 1 + 0.07 * Math.sin(Math.PI * u),
        };
      }

      return {};
    },
    eyes(c, { cy }) {
      arc(c, { cx: EYE.left, cy: cy + 48, r: 60 });
      arc(c, { cx: EYE.right, cy: cy + 48, r: 60 });
    },
  },
  bug: {
    body: (t) => ({ dx: 6 * Math.sin(TAU * t * 10), rot: 0.02 * Math.sin(TAU * t * 5) }),
    eyes(c, { t, cy }) {
      const look = 30 * Math.sin(TAU * t);

      dot(c, { x: 408 + look, y: cy + 8, r: 86 });
      dot(c, { x: 616 + look, y: cy + 8, r: 86 });
    },
    extra(c, { t, ink }) {
      const pulse = 1 + 0.12 * Math.sin(TAU * t * 2);

      c.translate(842, 300);
      c.rotate(0.15 * Math.sin(TAU * t * 2));
      c.scale(pulse, pulse);
      dot(c, { x: 0, y: 0, r: 54, colour: ink });
      c.beginPath();
      c.roundRect(-9, -32, 18, 40, 9);
      c.fillStyle = SIGNAL;
      c.fill();
      dot(c, { x: 0, y: 22, r: 10, colour: SIGNAL });
    },
  },
  flaky: {
    body: (t) => ({ rot: -0.04 * Math.sin(TAU * t) }),
    eyes(c, { t, cy }) {
      const ox = 24 * Math.sin(TAU * t);

      pill(c, { cx: EYE.left + ox, cy, w: 148, h: 56, r: 28 });
      pill(c, { cx: EYE.right + ox, cy, w: EYE.width, h: EYE.height });
    },
  },
  thinking: {
    body: (t) => ({ rot: 0.025 * Math.sin(TAU * t), dy: -4 * Math.sin(TAU * t) }),
    eyes(c, { t, cy }) {
      const ox = 16 * Math.sin(TAU * t);

      pill(c, { cx: EYE.left - 24 + ox, cy: cy - 40, w: EYE.width, h: EYE.height });
      pill(c, { cx: EYE.right - 24 + ox, cy: cy - 40, w: EYE.width, h: EYE.height });
    },
    extra(c, { t, ink }) {
      const shown = Math.floor(t * 4);
      const thoughts = [
        { x: 196, y: 296, r: 22 },
        { x: 144, y: 240, r: 17 },
        { x: 104, y: 190, r: 12 },
      ];

      for (const [index, thought] of thoughts.entries())
        if (index < shown) dot(c, { ...thought, colour: ink });
    },
  },
  broken: {
    body(t) {
      const frame = Math.floor(t * 30);
      const jolt = frame % 3 === 0 && t < 0.5 ? 8 : 0;

      return {
        dx: jolt * (frame % 2 ? 1 : -1),
        rot: 0.07 * Math.sin(TAU * t * 2) * (t < 0.5 ? 1 : 0.4),
      };
    },
    eyes(c, { cy }) {
      const { left, right } = EYE;

      line(c, {
        points: [
          [left - 40, cy - 40],
          [left + 40, cy + 40],
        ],
      });
      line(c, {
        points: [
          [left + 40, cy - 40],
          [left - 40, cy + 40],
        ],
      });
      line(c, {
        points: [
          [right - 40, cy - 28],
          [right + 40, cy + 52],
        ],
      });
      line(c, {
        points: [
          [right + 40, cy - 28],
          [right - 40, cy + 52],
        ],
      });
    },
    extra(c, { t, ink }) {
      const frame = Math.floor(t * 30);

      if (t < 0.5 && frame % 4 < 2)
        line(c, {
          points: [
            [838, 214],
            [876, 252],
            [848, 280],
            [892, 324],
          ],
          width: 20,
          colour: ink,
        });
    },
  },
  sleeping: {
    body(t) {
      const breath = Math.sin(TAU * t);

      return { sy: 1 + 0.035 * breath, sx: 1 - 0.02 * breath };
    },
    eyes(c, { cy }) {
      pill(c, { cx: EYE.left, cy: cy + 40, w: 136, h: 32, r: 16 });
      pill(c, { cx: EYE.right, cy: cy + 40, w: 136, h: 32, r: 16 });
    },
    extra(c, { t, ink }) {
      for (let k = 0; k < 2; k++) {
        const u = (t + k * 0.5) % 1;
        const alpha = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
        const side = 38 + 26 * u;
        const x = 790 + 56 * u;
        const y = 270 - 150 * u;

        line(c, {
          points: [
            [x, y],
            [x + side, y],
            [x, y + side],
            [x + side, y + side],
          ],
          width: 14,
          alpha: Math.max(0, Math.min(1, alpha)),
          colour: ink,
        });
      }
    },
  },
};

/**
 * Desenha o QAzinho num quadro do humor dele, portado do `olhos.js` da designer: o corpo
 * baixinho com os olhos acesos, cortado justo (`figure`), ou o ícone quadrado do app.
 */
export function drawIntern(props: {
  context: CanvasRenderingContext2D;
  layer: CanvasRenderingContext2D;
  size: number;
  mood: InternMood;
  t: number;
  form: 'stage' | 'figure' | 'icon';
  ink: string;
}): void {
  const { context, layer, size, mood, t, form, ink } = props;
  const pose = POSES[mood];
  const frame = FRAMES[form];
  const scaleBy = size / frame.side;
  const base = translate(scale(IDENTITY, [scaleBy, scaleBy]), [-frame.x, -frame.y]);

  context.setTransform(...IDENTITY);
  context.clearRect(0, 0, size, size);
  layer.setTransform(...IDENTITY);
  layer.clearRect(0, 0, size, size);

  if (form === 'icon') drawIcon({ context, layer, pose, t, base, scaleBy });
  else drawCharacter({ context, layer, pose, t, base, scaleBy, ink });

  context.setTransform(...IDENTITY);
}

function drawCharacter(props: {
  context: CanvasRenderingContext2D;
  layer: CanvasRenderingContext2D;
  pose: Pose;
  t: number;
  base: Matrix;
  scaleBy: number;
  ink: string;
}): void {
  const { context: c, layer, pose, t, scaleBy, ink } = props;
  const base = translate(props.base, [0, -10]);
  const { dx = 0, dy = 0, sx = 1, sy = 1, rot = 0 } = pose.body(t);
  const moved = translate(
    scale(rotate(translate(base, [512 + dx, BOTTOM + dy]), rot), [sx, sy]),
    [-512, -BOTTOM],
  );
  const reach = Math.max(0.5, 1 + dy / 240);

  c.setTransform(
    ...scale(translate(base, [512 + dx, BOTTOM + 34]), [300 * reach, 30 * reach]),
  );
  const ground = c.createRadialGradient(0, 0, 0, 0, 0, 1);

  ground.addColorStop(0, 'rgba(22, 21, 15, 0.28)');
  ground.addColorStop(1, 'rgba(22, 21, 15, 0)');
  c.fillStyle = ground;
  c.beginPath();
  c.arc(0, 0, 1, 0, TAU);
  c.fill();

  c.setTransform(...moved);
  const shell = c.createLinearGradient(0, BODY.y, 0, BOTTOM);

  shell.addColorStop(0, '#2e2b21');
  shell.addColorStop(1, '#100f0a');
  c.fillStyle = shell;
  bodyPath(c);
  c.fill();
  c.save();
  bodyPath(c);
  c.clip();
  c.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  c.lineWidth = 6;
  bodyPath(c);
  c.stroke();
  c.restore();

  const glass = c.createLinearGradient(0, BODY.y + BODY.inset, 0, BOTTOM - BODY.inset);

  glass.addColorStop(0, '#15140e');
  glass.addColorStop(1, '#060504');
  c.fillStyle = glass;
  screenPath(c);
  c.fill();
  c.save();
  screenPath(c);
  c.clip();
  halo(c, { x: 512, y: PUPIL_Y, r: 300, strength: 0.18 });
  c.fillRect(BODY.x, BODY.y, BODY.width, BODY.height);

  if (pose.sweep === true) {
    const y = BODY.y + BODY.height * t;
    const wipe = c.createLinearGradient(0, y - 60, 0, y + 6);

    wipe.addColorStop(0, 'rgba(255, 210, 63, 0)');
    wipe.addColorStop(1, 'rgba(255, 210, 63, 0.12)');
    c.fillStyle = wipe;
    c.fillRect(BODY.x, y - 60, BODY.width, 66);
  }

  c.restore();

  layer.setTransform(...moved);
  pose.eyes(layer, { t, cy: PUPIL_Y });
  scanLines(layer, { from: BODY.y - 40, to: BOTTOM + 40 });
  c.save();
  c.setTransform(...moved);
  screenPath(c);
  c.clip();
  glow(c, { layer, scaleBy });
  c.restore();

  c.save();
  c.setTransform(...moved);
  screenPath(c);
  c.clip();
  gloss(c, { x: BODY.x, y: BODY.y, reach: 470, fade: 380, strength: 0.08 });
  c.restore();

  if (pose.extra) {
    c.save();
    c.setTransform(...moved);
    pose.extra(c, { t, ink });
    c.restore();
  }
}

function drawIcon(props: {
  context: CanvasRenderingContext2D;
  layer: CanvasRenderingContext2D;
  pose: Pose;
  t: number;
  base: Matrix;
  scaleBy: number;
}): void {
  const { context: c, layer, pose, t, base, scaleBy } = props;

  c.setTransform(...base);
  c.save();
  c.shadowColor = 'rgba(0, 0, 0, 0.28)';
  c.shadowBlur = 28 * scaleBy;
  c.shadowOffsetY = 12 * scaleBy;
  const tile = c.createLinearGradient(0, 100, 0, 924);

  tile.addColorStop(0, '#1d1b13');
  tile.addColorStop(1, '#0a0906');
  c.fillStyle = tile;
  squirclePath(c);
  c.fill();
  c.restore();

  c.save();
  squirclePath(c);
  c.clip();
  halo(c, { x: 512, y: 500, r: 340, strength: 0.2 });
  c.fillRect(100, 100, 824, 824);
  c.restore();

  layer.setTransform(...base);
  pose.eyes(layer, { t, cy: 500 });
  scanLines(layer, { from: 0, to: 1024 });
  glow(c, { layer, scaleBy });

  c.setTransform(...base);
  c.save();
  squirclePath(c);
  c.clip();
  gloss(c, { x: 100, y: 100, reach: 560, fade: 460, strength: 0.09 });
  c.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  c.lineWidth = 6;
  squirclePath(c);
  c.stroke();
  c.restore();
}

function glow(
  c: CanvasRenderingContext2D,
  props: { layer: CanvasRenderingContext2D; scaleBy: number },
): void {
  const { layer, scaleBy } = props;

  c.save();
  c.setTransform(...IDENTITY);
  c.shadowColor = 'rgba(255, 210, 63, 0.85)';
  c.shadowBlur = 44 * scaleBy;
  c.drawImage(layer.canvas, 0, 0);
  c.shadowColor = 'rgba(255, 210, 63, 0.5)';
  c.shadowBlur = 12 * scaleBy;
  c.drawImage(layer.canvas, 0, 0);
  c.restore();
}

function halo(
  c: CanvasRenderingContext2D,
  props: { x: number; y: number; r: number; strength: number },
): void {
  const light = c.createRadialGradient(props.x, props.y, 0, props.x, props.y, props.r);

  light.addColorStop(0, `rgba(255, 210, 63, ${String(props.strength)})`);
  light.addColorStop(1, 'rgba(255, 210, 63, 0)');
  c.fillStyle = light;
}

function gloss(
  c: CanvasRenderingContext2D,
  props: { x: number; y: number; reach: number; fade: number; strength: number },
): void {
  const { x, y, reach, fade, strength } = props;
  const sheen = c.createLinearGradient(x, y, x + fade, y + fade);

  sheen.addColorStop(0, `rgba(255, 255, 255, ${String(strength)})`);
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  c.fillStyle = sheen;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + reach, y);
  c.lineTo(x, y + reach);
  c.closePath();
  c.fill();
}

function scanLines(
  c: CanvasRenderingContext2D,
  props: { from: number; to: number },
): void {
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = 'rgba(0, 0, 0, 0.22)';

  for (let y = props.from; y < props.to; y += 16) c.fillRect(0, y, 1024, 5);

  c.globalCompositeOperation = 'source-over';
}

function signal(c: CanvasRenderingContext2D, props: { from: number; to: number }) {
  const light = c.createLinearGradient(0, props.from, 0, props.to);

  light.addColorStop(0, '#fff3c2');
  light.addColorStop(0.5, SIGNAL);
  light.addColorStop(1, '#e3a400');

  return light;
}

function pill(
  c: CanvasRenderingContext2D,
  props: { cx: number; cy: number; w: number; h: number; r?: number },
): void {
  const { cx, cy, w, h, r = EYE.radius } = props;

  c.beginPath();
  c.roundRect(cx - w / 2, cy - h / 2, w, h, Math.min(r, w / 2, h / 2));
  c.fillStyle = signal(c, { from: cy - h / 2, to: cy + h / 2 });
  c.fill();
}

function dot(
  c: CanvasRenderingContext2D,
  props: { x: number; y: number; r: number; colour?: string },
): void {
  const { x, y, r } = props;

  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fillStyle = props.colour ?? signal(c, { from: y - r, to: y + r });
  c.fill();
}

function line(
  c: CanvasRenderingContext2D,
  props: { points: [number, number][]; width?: number; alpha?: number; colour?: string },
): void {
  const { points, width = 44, alpha = 1 } = props;
  const ys = points.map(([, y]) => y);

  c.save();
  c.globalAlpha = alpha;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle =
    props.colour ??
    signal(c, { from: Math.min(...ys) - width / 2, to: Math.max(...ys) + width / 2 });
  c.beginPath();

  for (const [index, [x, y]] of points.entries())
    if (index === 0) c.moveTo(x, y);
    else c.lineTo(x, y);

  c.stroke();
  c.restore();
}

function arc(
  c: CanvasRenderingContext2D,
  props: { cx: number; cy: number; r: number },
): void {
  const { cx, cy, r } = props;
  const width = 44;

  c.save();
  c.lineWidth = width;
  c.lineCap = 'round';
  c.strokeStyle = signal(c, { from: cy - r - width / 2, to: cy + width / 2 });
  c.beginPath();
  c.arc(cx, cy, r, Math.PI, TAU);
  c.stroke();
  c.restore();
}

function bodyPath(c: CanvasRenderingContext2D): void {
  c.beginPath();
  c.roundRect(BODY.x, BODY.y, BODY.width, BODY.height, [170, 170, 140, 140]);
}

function screenPath(c: CanvasRenderingContext2D): void {
  const { x, y, width, height, inset } = BODY;

  c.beginPath();
  c.roundRect(
    x + inset,
    y + inset,
    width - 2 * inset,
    height - 2 * inset,
    [142, 142, 112, 112],
  );
}

function squirclePath(c: CanvasRenderingContext2D): void {
  c.beginPath();
  c.moveTo(INTERN_SQUIRCLE[0] ?? 0, INTERN_SQUIRCLE[1] ?? 0);

  for (let index = 2; index < INTERN_SQUIRCLE.length; index += 2)
    c.lineTo(INTERN_SQUIRCLE[index] ?? 0, INTERN_SQUIRCLE[index + 1] ?? 0);

  c.closePath();
}

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function translate(m: Matrix, [x, y]: [number, number]): Matrix {
  return multiply(m, [1, 0, 0, 1, x, y]);
}

function scale(m: Matrix, [x, y]: [number, number]): Matrix {
  return multiply(m, [x, 0, 0, y, 0, 0]);
}

function rotate(m: Matrix, radians: number): Matrix {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return multiply(m, [cos, sin, -sin, cos, 0, 0]);
}
