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
  'quadraticCurveTo',
  'ellipse',
  'arc',
  'roundRect',
  'closePath',
  'clip',
  'fillRect',
];

/**
 * Um contexto 2D que lembra toda cor com que pintou, toda chamada que recebeu, e a sombra
 * de cada imagem posta nele.
 */
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

function draw(props: {
  mood: InternMood;
  t: number;
  isFigure?: boolean;
  size?: number;
  sticker?: string;
}) {
  const sheet = recorder('sheet');
  const screen = recorder('screen');

  drawIntern({
    context: screen.context,
    layer: sheet.context,
    size: props.size ?? 96,
    mood: props.mood,
    t: props.t,
    isFigure: props.isFigure ?? false,
    sticker: props.sticker ?? null,
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
  it('draws every mood at every phase in lime with dark eyes', () => {
    for (const mood of MOODS)
      for (const t of [0, 0.25, 0.5, 0.83, 0.99]) {
        const { sheet } = draw({ mood, t });

        expect(sheet.painted.has('#c6f432')).toBe(true);
        expect(sheet.painted.has('#141414')).toBe(true);
      }
  });

  /**
   * O visual de sticker pesava para trabalhar o dia todo: o mascote é chapado, sem borda
   * de recorte e sem brilho.
   */
  it('draws him flat: no white edge, no gloss', () => {
    const { sheet } = draw({ mood: 'neutral', t: 0 });

    expect(sheet.painted.has('#ffffff')).toBe(false);
    expect(
      [...sheet.painted].some((colour) => colour.startsWith('rgba(255, 255, 255')),
    ).toBe(false);
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

  it('lays him down once, with no shadow under him', () => {
    const { screen } = draw({ mood: 'neutral', t: 0 });

    expect(screen.calls.filter((call) => call === 'drawImage(sheet)')).toHaveLength(1);
    expect(screen.shadows.filter((shadow) => shadow !== '')).toEqual([]);
  });

  it('draws the logo as a sticker: a white edge, laid twice under its shadows, at the designer’s tilt', () => {
    const { sheet, screen } = draw({
      mood: 'neutral',
      t: 0,
      sticker: 'rgba(0, 0, 0, 0.55)',
    });

    expect(sheet.painted.has('#ffffff')).toBe(true);
    expect(sheet.calls).toContain(`rotate(${String((-6 * Math.PI) / 180)})`);
    expect(screen.calls.filter((call) => call === 'drawImage(sheet)')).toHaveLength(2);
    expect(screen.shadows).toEqual(['rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.16)']);
  });

  /**
   * A designer trocou o toco dele por uma antena com uma bolinha na ponta, que balança
   * com ele.
   */
  it('tops him with an antenna, its ball at the tip, swaying with him', () => {
    const still = draw({ mood: 'neutral', t: 0 });
    const swaying = draw({ mood: 'neutral', t: 0.25 });

    expect(still.sheet.calls).toContain('quadraticCurveTo(152,30,172,14)');
    expect(still.sheet.calls).toContain(`arc(176,12,15,0,${String(Math.PI * 2)})`);
    expect(swaying.sheet.calls).toContain(`rotate(${String(0.06 * 1.4)})`);
  });

  it('stands him upright', () => {
    const { sheet } = draw({ mood: 'neutral', t: 0 });

    expect(sheet.calls).toContain('rotate(0)');
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

  it('draws his thoughts as white-edged dots, one more each quarter, rising to his left clear of the antenna', () => {
    const arcs = (t: number) =>
      draw({ mood: 'thinking', t }).sheet.calls.filter((call) =>
        call.startsWith('arc(62,18'),
      );

    expect(arcs(0.1)).toHaveLength(0);
    expect(arcs(0.3)).toHaveLength(2);
    expect(
      draw({ mood: 'thinking', t: 0.8 }).sheet.calls.filter((call) =>
        call.startsWith('arc(6,-18'),
      ),
    ).toHaveLength(2);
  });
});
