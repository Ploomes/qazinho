import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { PLATFORM_LABEL } from '@/modules/Workspace/constants';

describe('PLATFORM_LABEL', () => {
  it('names every platform with a word the QA reads', () => {
    expect(Object.values(PLATFORM_LABEL).map((key) => i18n.t(key))).toEqual([
      'Web',
      'Android',
      'iOS',
    ]);
  });
});
