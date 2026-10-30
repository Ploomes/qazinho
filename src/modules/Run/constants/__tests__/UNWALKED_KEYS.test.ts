// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { UNWALKED_KEYS } from '@/modules/Run/constants';

describe('UNWALKED_KEYS', () => {
  /** Um passo pulado dizia "Skipped because the step before it did not hold up." numa página em português. */
  it.each(['en', 'pt'] as const)(
    'words every reason a step never ran, in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const said = Object.values(UNWALKED_KEYS).map((key) => t(key));

      expect(said.every((line) => !line.includes('RUN.'))).toBe(true);
      expect(new Set(said).size).toBe(said.length);
    },
  );

  it('words the step before not holding up in Portuguese for a Portuguese page', () => {
    expect(i18n.getFixedT('pt')(UNWALKED_KEYS.skipped)).not.toContain('Skipped');
  });
});
