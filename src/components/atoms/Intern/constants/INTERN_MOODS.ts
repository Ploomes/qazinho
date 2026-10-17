import type { InternMood } from '@/components/atoms/Intern/types';
import bugDark from '@brand/moods-sprite/estagiario-bug-escuro.png';
import bugLight from '@brand/moods-sprite/estagiario-bug.png';
import desconfiadoDark from '@brand/moods-sprite/estagiario-desconfiado-escuro.png';
import desconfiadoLight from '@brand/moods-sprite/estagiario-desconfiado.png';
import dormindoDark from '@brand/moods-sprite/estagiario-dormindo-escuro.png';
import dormindoLight from '@brand/moods-sprite/estagiario-dormindo.png';
import neutroDark from '@brand/moods-sprite/estagiario-neutro-escuro.png';
import neutroLight from '@brand/moods-sprite/estagiario-neutro.png';
import passouDark from '@brand/moods-sprite/estagiario-passou-escuro.png';
import passouLight from '@brand/moods-sprite/estagiario-passou.png';
import pensandoDark from '@brand/moods-sprite/estagiario-pensando-escuro.png';
import pensandoLight from '@brand/moods-sprite/estagiario-pensando.png';
import quebrouDark from '@brand/moods-sprite/estagiario-quebrou-escuro.png';
import quebrouLight from '@brand/moods-sprite/estagiario-quebrou.png';
import rodandoDark from '@brand/moods-sprite/estagiario-rodando-escuro.png';
import rodandoLight from '@brand/moods-sprite/estagiario-rodando.png';

/** Each mood as a strip of frames from the designer's GIF, on a clear ground, with a strip for Tinta. */
export const INTERN_MOODS: Record<
  InternMood,
  {
    light: string;
    dark: string;
    frames: number;
    frameMs: number;
    labelKey: `MASCOT.MOOD_${string}`;
  }
> = {
  neutral: {
    light: neutroLight,
    dark: neutroDark,
    frames: 36,
    frameMs: 50,
    labelKey: 'MASCOT.MOOD_NEUTRAL',
  },
  running: {
    light: rodandoLight,
    dark: rodandoDark,
    frames: 32,
    frameMs: 50,
    labelKey: 'MASCOT.MOOD_RUNNING',
  },
  passed: {
    light: passouLight,
    dark: passouDark,
    frames: 30,
    frameMs: 40,
    labelKey: 'MASCOT.MOOD_PASSED',
  },
  bug: {
    light: bugLight,
    dark: bugDark,
    frames: 40,
    frameMs: 50,
    labelKey: 'MASCOT.MOOD_BUG',
  },
  flaky: {
    light: desconfiadoLight,
    dark: desconfiadoDark,
    frames: 40,
    frameMs: 50,
    labelKey: 'MASCOT.MOOD_FLAKY',
  },
  thinking: {
    light: pensandoLight,
    dark: pensandoDark,
    frames: 40,
    frameMs: 50,
    labelKey: 'MASCOT.MOOD_THINKING',
  },
  broken: {
    light: quebrouLight,
    dark: quebrouDark,
    frames: 30,
    frameMs: 50,
    labelKey: 'MASCOT.MOOD_BROKEN',
  },
  sleeping: {
    light: dormindoLight,
    dark: dormindoDark,
    frames: 48,
    frameMs: 60,
    labelKey: 'MASCOT.MOOD_SLEEPING',
  },
};
