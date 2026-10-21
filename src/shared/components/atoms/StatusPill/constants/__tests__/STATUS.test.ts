// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { ICONS } from '@/shared/components/atoms/Icon/constants';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';

/**
 * A new workspace read "parado" in Portuguese, the word for one the QA stopped: two states
 * shared a word, and nothing on screen told them apart.
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

  /** At the size of the small text beside it, a bare check read as a typed ✓: a status wears a solid circle. */
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
