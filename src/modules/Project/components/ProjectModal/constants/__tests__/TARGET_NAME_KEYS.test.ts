// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { TARGET_NAME_KEYS } from '@/modules/Project/components/ProjectModal/constants';

describe('TARGET_NAME_KEYS', () => {
  it.each(['en', 'pt'] as const)('names every platform by itself, in %s', (language) => {
    const t = i18n.getFixedT(language);

    expect(Object.values(TARGET_NAME_KEYS).map((key) => t(key))).toEqual([
      'Web',
      'Android',
      'iOS',
    ]);
  });
});
