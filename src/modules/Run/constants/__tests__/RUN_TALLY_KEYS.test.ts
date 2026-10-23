// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { RUN_TALLY_KEYS } from '@/modules/Run/constants';

describe('RUN_TALLY_KEYS', () => {
  it.each(['en', 'pt'] as const)(
    'words each verdict for one case and for many, in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const said = Object.values(RUN_TALLY_KEYS).flatMap(({ one, other }) => [
        t(one),
        t(other, { count: 3 }),
      ]);

      expect(said.every((line) => !line.includes('RUN.') && !line.includes('{{'))).toBe(
        true,
      );
      expect(new Set(said).size).toBe(said.length);
    },
  );

  it('says one case in the singular in Portuguese', () => {
    const t = i18n.getFixedT('pt');

    expect(t(RUN_TALLY_KEYS.failed.one)).toBe('1 falhou');
    expect(t(RUN_TALLY_KEYS.failed.other, { count: 2 })).toBe('2 falharam');
  });
});
