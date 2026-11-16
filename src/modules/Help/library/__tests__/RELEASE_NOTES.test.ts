import { describe, expect, it } from 'vitest';
import { en, pt } from '@/languages/locales';
import { RELEASE_NOTES } from '@/modules/Help/constants';

const textOf = (locale: Record<string, Record<string, string>>, key: string) => {
  const [space = '', name = ''] = key.split('.');

  return locale[space]?.[name];
};

describe('RELEASE_NOTES', () => {
  it('says every note in both languages', () => {
    for (const release of RELEASE_NOTES)
      for (const key of release.notes) {
        expect(textOf(en as never, key), key).toBeTypeOf('string');
        expect(textOf(pt as never, key), key).toBeTypeOf('string');
      }
  });

  it('dates every version and gives it a headline', () => {
    for (const release of RELEASE_NOTES) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.notes.length).toBeGreaterThan(0);
    }
  });
});
