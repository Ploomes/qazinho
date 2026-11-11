import type { InternMood } from '@/shared/components/atoms/Intern/types';
import { describe, expect, it } from 'vitest';
import { drawIntern } from '@/shared/components/atoms/Intern/library';

const METHODS = [
  'clearRect',
  'translate',
  'rotate',
  'scale',
  'save',
  'restore',
  'beginPath',
  'moveTo',
  'lineTo',
  'arc',
  'roundRect',
  'closePath',
  'clip',
  'fillRect',
];

/**
 * Um contexto 2D que lembra toda cor com que pintou, toda chamada que recebeu, toda
 * transformação e o brilho de cada imagem posta nele.
 */
function recorder(name: string) {
  const painted = new Set<string>();
  const stops = new Set<string>();
  const calls: string[] = [];
  const transforms: number[][] = [];
  const glows: string[] = [];
  const gradient = () => ({
    addColorStop: (_at: number, colour: string) => {
      stops.add(colour);
    },
  });
  const context = {
    canvas: { name },
    fillStyle: '' as unknown,
    strokeStyle: '' as unknown,
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetY: 0,
    fill() {
      if (typeof context.fillStyle === 'string') painted.add(context.fillStyle);
    },
    stroke() {
      if (typeof context.strokeStyle === 'string') painted.add(context.strokeStyle);
    },
    setTransform(...matrix: number[]) {
      transforms.push(matrix);
      calls.push(`setTransform(${matrix.join(',')})`);
    },
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    drawImage(image: { name: string }) {
      calls.push(`drawImage(${image.name})`);
      glows.push(context.shadowColor);
    },
    ...Object.fromEntries(
      METHODS.map((method) => [
        method,
        (...args: unknown[]) => {
          calls.push(`${method}(${args.map(String).join(',')})`);
        },
      ]),
    ),
  };

  return {
    context: context as unknown as CanvasRenderingContext2D,
    painted,
    stops,
    calls,
    transforms,
    glows,
  };
}

function draw(props: {
  mood: InternMood;
  t: number;
  form?: 'stage' | 'figure' | 'icon';
  size?: number;
  ink?: string;
}) {
  const sheet = recorder('sheet');
  const screen = recorder('screen');

  drawIntern({
    context: screen.context,
    layer: sheet.context,
    size: props.size ?? 96,
    mood: props.mood,
    t: props.t,
    form: props.form ?? 'stage',
    ink: props.ink ?? '#16150f',
  });

  return { sheet, screen };
}

const MOODS: InternMood[] = [
  'neutral',
  'running',
  'passed',
  'bug',
  'flaky',
  'thinking',
  'broken',
  'sleeping',
];

describe('drawIntern', () => {
  /** A marca nova: o personagem é uma tela escura, e os olhos são a luz do Sinal. */
  it('lights his eyes in the Signal yellow, on every mood and phase', () => {
    for (const mood of MOODS)
      for (const t of [0, 0.25, 0.5, 0.83, 0.99]) {
        const { sheet } = draw({ mood, t });

        expect(sheet.stops.has('#ffd23f')).toBe(true);
      }
  });

  it('wipes both canvases before each frame, so a moving pose leaves no trail', () => {
    const { sheet, screen } = draw({ mood: 'running', t: 0.3 });

    expect(screen.calls.slice(0, 2)).toEqual([
      'setTransform(1,0,0,1,0,0)',
      'clearRect(0,0,96,96)',
    ]);
    expect(sheet.calls.slice(0, 2)).toEqual([
      'setTransform(1,0,0,1,0,0)',
      'clearRect(0,0,96,96)',
    ]);
  });

  it('lays the eyes on the screen twice, under a wide glow and a tight one', () => {
    const { screen } = draw({ mood: 'neutral', t: 0 });

    expect(screen.calls.filter((call) => call === 'drawImage(sheet)')).toHaveLength(2);
    expect(screen.glows).toEqual(['rgba(255, 210, 63, 0.85)', 'rgba(255, 210, 63, 0.5)']);
  });

  it('draws the marks outside his body in the ink it is given, so they show on either theme', () => {
    for (const mood of ['bug', 'thinking', 'broken', 'sleeping'] as const) {
      const t = { bug: 0.2, thinking: 0.9, broken: 0.04, sleeping: 0.3 }[mood];

      expect(draw({ mood, t, ink: '#f2f1ec' }).screen.painted.has('#f2f1ec')).toBe(true);
    }
  });

  it('shows no thought before the first quarter, and all three by the end', () => {
    const count = (t: number) =>
      draw({ mood: 'thinking', t, ink: '#abcdef' }).screen.calls.filter(
        (call) => call.startsWith('arc(') && !call.startsWith('arc(0,0,1,'),
      ).length;

    expect(count(0.1)).toBe(0);
    expect(count(0.9)).toBe(3);
  });

  it('draws the app icon as the designer’s squircle, with no ground shadow under it', () => {
    const { screen } = draw({ mood: 'neutral', t: 0, form: 'icon' });

    expect(
      screen.calls.filter((call) => call.startsWith('lineTo(')).length,
    ).toBeGreaterThan(150);
    expect(screen.calls).not.toContain(`arc(0,0,1,0,${String(Math.PI * 2)})`);
  });

  it('crops a small face tighter than a mood, which keeps room for its marks', () => {
    const scaleOf = (form: 'stage' | 'figure') =>
      draw({ mood: 'neutral', t: 0, form, size: 1024 }).screen.transforms[2]?.[0] ?? 0;

    expect(scaleOf('stage')).toBe(1);
    expect(scaleOf('figure')).toBeGreaterThan(1.2);
  });

  it('stands still at rest, and only the running mood sweeps a line down his screen', () => {
    const sweeps = (mood: InternMood) =>
      draw({ mood, t: 0.5 }).screen.calls.filter((call) =>
        call.startsWith('fillRect(182,'),
      ).length;

    expect(sweeps('running')).toBe(2);
    expect(sweeps('neutral')).toBe(1);
  });
});
