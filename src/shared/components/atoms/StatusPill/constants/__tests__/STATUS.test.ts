// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { ICONS } from '@/shared/components/atoms/Icon/constants';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';

/**
 * Um workspace novo aparecia como "parado" em português, a palavra para um que o QA
 * parou: dois estados dividiam uma palavra, e nada na tela os distinguia.
 */
describe('STATUS', () => {
  it.each(['en', 'pt'] as const)(
    'gives every status a word of its own, in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const words = Object.values(STATUS).map(({ labelKey }) => t(labelKey));

      expect(new Set(words).size).toBe(words.length);
    },
  );

  it('marks each status with an icon of its own, so colour is never the only clue', () => {
    const icons = Object.values(STATUS).map(({ icon }) => icon);

    expect(new Set(icons).size).toBe(icons.length);
  });

  /**
   * No tamanho do texto pequeno ao lado, um check solto parecia um ✓ digitado: um status
   * veste um círculo sólido.
   */
  it('draws a status that happened in a solid circle, and one that has not yet as an outline', () => {
    const weights = Object.fromEntries(
      Object.entries(STATUS).map(([status, { icon }]) => [status, ICONS[icon].weight]),
    );

    expect(weights).toEqual({
      running: 'fill',
      paused: 'fill',
      attention: 'fill',
      failed: 'fill',
      passed: 'fill',
      blocked: 'fill',
      skipped: 'fill',
      stopped: 'fill',
      idle: 'bold',
      pending: 'bold',
    });
  });
});
