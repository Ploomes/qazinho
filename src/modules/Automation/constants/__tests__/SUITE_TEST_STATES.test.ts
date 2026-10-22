// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { SUITE_TEST_STATES } from '@/modules/Automation/constants';
import { ICONS } from '@/shared/components/atoms/Icon/constants';

describe('SUITE_TEST_STATES', () => {
  it('marks every state with an icon of its own, so colour is never the only clue', () => {
    const icons = Object.values(SUITE_TEST_STATES).map(({ icon }) => icon);

    expect(new Set(icons).size).toBe(icons.length);
    expect(icons.every((icon) => icon in ICONS)).toBe(true);
  });

  it.each(['en', 'pt'] as const)(
    'names every state with a word of its own in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const words = Object.values(SUITE_TEST_STATES).map(({ labelKey }) => t(labelKey));

      expect(new Set(words).size).toBe(words.length);
    },
  );

  it('paints a failure red and a pass on a retry as a warning', () => {
    expect([SUITE_TEST_STATES.failed.tone, SUITE_TEST_STATES.flaky.tone]).toEqual([
      'fail',
      'attn',
    ]);
  });
});
