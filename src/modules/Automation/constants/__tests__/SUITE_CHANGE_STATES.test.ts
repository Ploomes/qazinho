// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { SUITE_CHANGE_STATES } from '@/modules/Automation/constants';
import { ICONS } from '@/shared/components/atoms/Icon/constants';

describe('SUITE_CHANGE_STATES', () => {
  it('marks every state of a change with an icon of its own, so colour is never the only clue', () => {
    const icons = Object.values(SUITE_CHANGE_STATES).map(({ icon }) => icon);

    expect(new Set(icons).size).toBe(icons.length);
    expect(icons.every((icon) => icon in ICONS)).toBe(true);
  });

  it.each(['en', 'pt'] as const)(
    'names every state with a word of its own in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const words = Object.values(SUITE_CHANGE_STATES).map(({ labelKey }) => t(labelKey));

      expect(new Set(words).size).toBe(words.length);
    },
  );

  /** An app that is wrong is a bug for the QA to file, never a fix the agent got wrong. */
  it('paints an app that is wrong as a bug', () => {
    expect(SUITE_CHANGE_STATES['app-bug']).toMatchObject({ icon: 'bug', tone: 'fail' });
  });
});
