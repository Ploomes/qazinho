import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { pt } from '@/languages/locales/pt';
import { JIRA_FAILURE_KEYS } from '@/modules/Setup/constants';

describe('JIRA_FAILURE_KEYS', () => {
  it('says every way Jira can refuse, in both languages', () => {
    for (const key of Object.values(JIRA_FAILURE_KEYS)) {
      const name = key.replace('JIRA.', '') as keyof typeof en.JIRA;

      expect(en.JIRA[name]).toBeTruthy();
      expect(pt.JIRA[name]).toBeTruthy();
    }
  });

  it('covers the six failures, no more', () => {
    expect(Object.keys(JIRA_FAILURE_KEYS)).toHaveLength(6);
  });
});
