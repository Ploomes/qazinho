import { describe, expect, it } from 'vitest';
import { lookOf } from '@/modules/Run/classes/video/ReplayComposer/library';

describe('lookOf', () => {
  it('reads each colour off its token, trimmed the way a computed style hands it', () => {
    const tokens: Record<string, string> = {
      '--panel': ' #121316',
      '--fail-soft': 'rgba(255, 77, 46, 0.14) ',
    };
    const look = lookOf({ getPropertyValue: (name) => tokens[name] ?? '' });

    expect(look.panel).toBe('#121316');
    expect(look.failSoft).toBe('rgba(255, 77, 46, 0.14)');
  });

  it('reads every colour the strip draws with from the theme', () => {
    const asked: string[] = [];

    lookOf({
      getPropertyValue: (name) => {
        asked.push(name);

        return '';
      },
    });

    expect(asked.every((name) => name.startsWith('--'))).toBe(true);
    expect(asked).toHaveLength(14);
  });
});
