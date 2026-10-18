import type { InternMood } from '@/shared/components/atoms/Intern/types';
import { describe, expect, it } from 'vitest';
import { drawIntern } from '@/shared/components/atoms/Intern/library';

const METHODS = [
  'setTransform',
  'clearRect',
  'translate',
  'rotate',
  'scale',
  'save',
  'restore',
  'beginPath',
  'moveTo',
  'lineTo',
  'ellipse',
  'arc',
  'roundRect',
  'closePath',
  'clip',
  'fillRect',
];

/** A 2D context that remembers every colour it painted with, every call it took, and the shadow of each image laid on it. */
function recorder(name: string) {
  const painted = new Set<string>();
  const calls: string[] = [];
  const shadows: string[] = [];
  const context = {
    canvas: { name },
    fillStyle: '' as unknown,
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetY: 0,
    fill() {
      if (typeof context.fillStyle === 'string') painted.add(context.fillStyle);
    },
    stroke() {
      painted.add(context.strokeStyle);
    },
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    drawImage(image: { name: string }) {
      calls.push(`drawImage(${image.name})`);
      shadows.push(context.shadowColor);
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
    calls,
    shadows,
  };
}

function draw(props: { mood: InternMood; t: number; isFigure?: boolean; size?: number }) {
  const sheet = recorder('sheet');
  const screen = recorder('screen');

  drawIntern({
    context: screen.context,
    layer: sheet.context,
    size: props.size ?? 96,
    mood: props.mood,
    t: props.t,
    shadow: 'rgba(0, 0, 0, 0.55)',
    isFigure: props.isFigure ?? false,
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
  it('cuts every mood at every phase as a sticker: lime, dark eyes, a white edge', () => {
    for (const mood of MOODS)
      for (const t of [0, 0.25, 0.5, 0.83, 0.99]) {
        const { sheet } = draw({ mood, t });

        expect(sheet.painted.has('#c6f432')).toBe(true);
        expect(sheet.painted.has('#141414')).toBe(true);
        expect(sheet.painted.has('#ffffff')).toBe(true);
      }
  });

  it('wipes both canvases before each frame, so a moving pose leaves no trail', () => {
    const { sheet, screen } = draw({ mood: 'running', t: 0.3 });

    expect(sheet.calls.slice(0, 2)).toEqual([
      'setTransform(1,0,0,1,0,0)',
      'clearRect(0,0,96,96)',
    ]);
    expect(screen.calls.slice(0, 2)).toEqual([
      'setTransform(1,0,0,1,0,0)',
      'clearRect(0,0,96,96)',
    ]);
  });

  it('lays the sticker down twice: once under the shadow it is given, once under a contact shadow', () => {
    const { screen } = draw({ mood: 'neutral', t: 0 });

    expect(screen.calls.filter((call) => call === 'drawImage(sheet)')).toHaveLength(2);
    expect(screen.shadows).toEqual(['rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.16)']);
  });

  it('stands him at the tilt the designer stuck him on', () => {
    const { sheet } = draw({ mood: 'neutral', t: 0 });

    expect(sheet.calls).toContain(`rotate(${String((-6 * Math.PI) / 180)})`);
  });

  it('crops a logo tighter than a mood, which keeps room for its marks', () => {
    const logo = draw({ mood: 'neutral', t: 0, isFigure: true, size: 300 });
    const stage = draw({ mood: 'neutral', t: 0, size: 340 });

    expect(logo.sheet.calls).toContain('scale(1,1)');
    expect(stage.sheet.calls).toContain('scale(1,1)');
    expect(
      draw({ mood: 'neutral', t: 0, isFigure: true, size: 340 }).sheet.calls,
    ).not.toContain('scale(1,1)');
  });

  it('marks a bug with a red sticker badge, edged in white so it shows on either theme', () => {
    const { sheet } = draw({ mood: 'bug', t: 0.2 });

    expect(sheet.painted.has('#ff4d2e')).toBe(true);
  });

  it('draws his thoughts as white-edged dots, one more each quarter', () => {
    const arcs = (t: number) =>
      draw({ mood: 'thinking', t }).sheet.calls.filter((call) =>
        call.startsWith('arc(196,12'),
      );

    expect(arcs(0.1)).toHaveLength(0);
    expect(arcs(0.3)).toHaveLength(2);
  });
});
