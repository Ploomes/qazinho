import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { pt } from '@/languages/locales/pt';
import { ORG_TEMPLATE_FAILURE_KEYS } from '@/modules/Template/constants';

describe('ORG_TEMPLATE_FAILURE_KEYS', () => {
  it('says every way the org can refuse a template, in both languages', () => {
    for (const key of Object.values(ORG_TEMPLATE_FAILURE_KEYS)) {
      const name = key.replace('TEMPLATES.', '') as keyof typeof en.TEMPLATES;

      expect(en.TEMPLATES[name]).toBeTruthy();
      expect(pt.TEMPLATES[name]).toBeTruthy();
    }
  });

  it('covers the four failures, no more', () => {
    expect(Object.keys(ORG_TEMPLATE_FAILURE_KEYS)).toHaveLength(4);
  });
});
