import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { pt } from '@/languages/locales/pt';
import { DOC_VERDICT_KEYS } from '@/modules/Plan/screens/Plan/constants';

describe('DOC_VERDICT_KEYS', () => {
  it('names every verdict a published step can carry, in both languages', () => {
    for (const key of Object.values(DOC_VERDICT_KEYS)) {
      const name = key.replace('STATUS.', '') as keyof typeof en.STATUS;

      expect(en.STATUS[name]).toBeTruthy();
      expect(pt.STATUS[name]).toBeTruthy();
    }
  });

  it('says a step the run never reached was not run', () => {
    expect(DOC_VERDICT_KEYS.pending).toBe('STATUS.NOT_RUN');
  });
});
