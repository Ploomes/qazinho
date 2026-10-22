// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { SUITE_CHANGE_FAILURE_KEYS } from '@/modules/Automation/constants';

describe('SUITE_CHANGE_FAILURE_KEYS', () => {
  it.each(['en', 'pt'] as const)(
    'says each reason a change left nothing to review in its own words in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const words = Object.values(SUITE_CHANGE_FAILURE_KEYS).map((key) => t(key));

      expect(new Set(words).size).toBe(words.length);
      expect(words.every((word) => !word.startsWith('AUTOMATION.'))).toBe(true);
    },
  );
});
