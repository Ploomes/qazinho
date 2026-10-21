import type { IStripLook } from '@/modules/Run/classes/video/ReplayComposer/types';

const TOKENS: Record<keyof IStripLook, string> = {
  screen: '--screen',
  panel: '--panel',
  line: '--line',
  line2: '--line2',
  ink: '--ink',
  ink2: '--ink2',
  ink3: '--ink3',
  pass: '--pass',
  attn: '--attn',
  fail: '--fail',
  failSoft: '--fail-soft',
  lime: '--lime',
  limeSoft: '--lime-soft',
};

/** The strip's colours out of the theme's tokens, as a computed style reads them. */
export function lookOf(style: {
  getPropertyValue: (name: string) => string;
}): IStripLook {
  const read = (token: string) => style.getPropertyValue(token).trim();

  return {
    screen: read(TOKENS.screen),
    panel: read(TOKENS.panel),
    line: read(TOKENS.line),
    line2: read(TOKENS.line2),
    ink: read(TOKENS.ink),
    ink2: read(TOKENS.ink2),
    ink3: read(TOKENS.ink3),
    pass: read(TOKENS.pass),
    attn: read(TOKENS.attn),
    fail: read(TOKENS.fail),
    failSoft: read(TOKENS.failSoft),
    lime: read(TOKENS.lime),
    limeSoft: read(TOKENS.limeSoft),
  };
}
