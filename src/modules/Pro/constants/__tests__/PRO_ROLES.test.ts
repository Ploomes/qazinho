// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { PRO_BILLING, PRO_ROLES } from '@/modules/Pro/constants';

describe('PRO_ROLES', () => {
  it('names each role in both languages', () => {
    expect(Object.values(PRO_ROLES).map((key) => i18n.getFixedT('pt')(key))).toEqual([
      'dono',
      'admin',
      'editor',
      'leitor',
    ]);
  });
});

describe('PRO_BILLING', () => {
  it('tells a paid-up org apart from a late, blocked or canceled one', () => {
    expect(PRO_BILLING.active.tone).toBe('pass');
    expect(PRO_BILLING.trialing.tone).toBe('pass');
    expect(PRO_BILLING.past_due.tone).toBe('attn');
    expect(PRO_BILLING.blocked.tone).toBe('fail');
    expect(PRO_BILLING.canceled.tone).toBe('skip');
  });

  it('names each state in English', () => {
    expect(
      Object.values(PRO_BILLING).map(({ labelKey }) => i18n.getFixedT('en')(labelKey)),
    ).toEqual(['in trial', 'active', 'payment late', 'blocked', 'canceled']);
  });
});
