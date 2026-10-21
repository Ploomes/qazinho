import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { pt } from '@/languages/locales/pt';
import { GITHUB_FAILURE_KEYS } from '@/modules/Setup/constants';

describe('GITHUB_FAILURE_KEYS', () => {
  it('says every way GitHub can refuse, in both languages', () => {
    for (const key of Object.values(GITHUB_FAILURE_KEYS)) {
      const name = key.replace('GITHUB.', '') as keyof typeof en.GITHUB;

      expect(en.GITHUB[name]).toBeTruthy();
      expect(pt.GITHUB[name]).toBeTruthy();
    }
  });

  it('covers the six failures, no more', () => {
    expect(Object.keys(GITHUB_FAILURE_KEYS)).toHaveLength(6);
  });
});
