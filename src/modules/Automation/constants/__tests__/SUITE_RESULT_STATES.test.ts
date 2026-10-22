// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { SUITE_RESULT_STATES } from '@/modules/Automation/constants';
import { ICONS } from '@/shared/components/atoms/Icon/constants';

describe('SUITE_RESULT_STATES', () => {
  it('marks every way a test can end with an icon of its own, so colour is never the only clue', () => {
    const icons = Object.values(SUITE_RESULT_STATES).map(({ icon }) => icon);

    expect(new Set(icons).size).toBe(icons.length);
    expect(icons.every((icon) => icon in ICONS)).toBe(true);
  });

  it.each(['en', 'pt'] as const)(
    'names every way with a word of its own in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const words = Object.values(SUITE_RESULT_STATES).map(({ labelKey }) => t(labelKey));

      expect(new Set(words).size).toBe(words.length);
    },
  );

  /** A test that ran out of time failed, even though Playwright names it apart. */
  it('paints a test that timed out as a failure', () => {
    expect(SUITE_RESULT_STATES.timedOut.tone).toBe('fail');
  });
});
