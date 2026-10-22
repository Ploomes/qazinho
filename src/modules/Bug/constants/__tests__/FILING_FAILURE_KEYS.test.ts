import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { pt } from '@/languages/locales/pt';
import { FILING_FAILURE_KEYS } from '@/modules/Bug/constants';

describe('FILING_FAILURE_KEYS', () => {
  it('says every way a tracker can refuse a bug, in both languages, naming the tracker', () => {
    for (const key of Object.values(FILING_FAILURE_KEYS)) {
      const name = key.replace('FILING.', '') as keyof typeof en.FILING;

      expect(en.FILING[name]).toContain('{{tracker}}');
      expect(pt.FILING[name]).toContain('{{tracker}}');
    }
  });

  it('covers the six failures, no more', () => {
    expect(Object.keys(FILING_FAILURE_KEYS)).toHaveLength(6);
  });
});
