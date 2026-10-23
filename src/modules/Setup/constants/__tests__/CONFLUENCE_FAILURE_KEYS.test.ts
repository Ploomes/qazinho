import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { pt } from '@/languages/locales/pt';
import { CONFLUENCE_FAILURE_KEYS } from '@/modules/Setup/constants';

describe('CONFLUENCE_FAILURE_KEYS', () => {
  it('says every way Confluence can refuse, in both languages', () => {
    for (const key of Object.values(CONFLUENCE_FAILURE_KEYS)) {
      const name = key.replace('CONFLUENCE.', '') as keyof typeof en.CONFLUENCE;

      expect(en.CONFLUENCE[name]).toBeTruthy();
      expect(pt.CONFLUENCE[name]).toBeTruthy();
    }
  });

  it('covers the six failures, no more', () => {
    expect(Object.keys(CONFLUENCE_FAILURE_KEYS)).toHaveLength(6);
  });
});
