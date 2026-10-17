import type { InternMood } from '@/components/atoms/Intern/types';
import { describe, expect, it } from 'vitest';
import { drawIntern } from '@/components/atoms/Intern/library';

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
];

/** A 2D context that remembers every colour it painted with and every transform it took. */
function recorder() {
  const painted = new Set<string>();
  const calls: string[] = [];
  const context = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    globalAlpha: 1,
    fill() {
      painted.add(context.fillStyle);
    },
    stroke() {
      painted.add(context.strokeStyle);
    },
    ...Object.fromEntries(
      METHODS.map((name) => [
        name,
        (...args: unknown[]) => {
          calls.push(`${name}(${args.map(String).join(',')})`);
        },
      ]),
    ),
  };

  return { context: context as unknown as CanvasRenderingContext2D, painted, calls };
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
  it('draws every mood at every phase without throwing, in lime with dark eyes', () => {
    for (const mood of MOODS)
      for (const t of [0, 0.25, 0.5, 0.83, 0.99]) {
        const { context, painted } = recorder();

        drawIntern({ context, size: 96, mood, t, mark: '#f4f2ea', isFigure: false });

        expect(painted.has('#c6f432')).toBe(true);
        expect(painted.has('#141414')).toBe(true);
      }
  });

  it('wipes the canvas before each frame, so a moving pose leaves no trail', () => {
    const { context, calls } = recorder();

    drawIntern({
      context,
      size: 96,
      mood: 'running',
      t: 0.3,
      mark: '#141414',
      isFigure: false,
    });

    expect(calls[0]).toBe('setTransform(1,0,0,1,0,0)');
    expect(calls[1]).toBe('clearRect(0,0,96,96)');
  });

  it('paints the marks outside his head in the ink it is given, so they show on Tinta', () => {
    const { context, painted } = recorder();

    drawIntern({
      context,
      size: 96,
      mood: 'sleeping',
      t: 0.3,
      mark: '#f4f2ea',
      isFigure: false,
    });

    expect(painted.has('#f4f2ea')).toBe(true);
  });

  it('fills the square with the figure alone for a logo, and leaves the stage for a mood', () => {
    const logo = recorder();
    const stage = recorder();

    drawIntern({
      context: logo.context,
      size: 240,
      mood: 'neutral',
      t: 0,
      mark: '',
      isFigure: true,
    });
    drawIntern({
      context: stage.context,
      size: 240,
      mood: 'neutral',
      t: 0,
      mark: '',
      isFigure: false,
    });

    expect(logo.calls).toContain('scale(1,1)');
    expect(stage.calls).toContain('scale(0.75,0.75)');
  });
});
