import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { planWithVariableRenamed } from '@/modules/Plan/library';

const CASE: ITestCase = {
  id: 'TC-01',
  title: 'Sign in as ${LOGIN_EMAIL}',
  priority: 'P1',
  goal: 'The ${LOGIN_EMAIL} account gets in.',
  preconditions: 'An account ${LOGIN_EMAIL} with ${LOGIN_PASSWORD}.',
  steps: [
    { action: 'Type ${LOGIN_EMAIL} in Email', expected: 'It reads ${LOGIN_EMAIL}' },
    { action: 'Type ${LOGIN_EMAIL_2} in Backup', expected: 'Saved' },
  ],
  lastVerdict: 'passed',
};

describe('planWithVariableRenamed', () => {
  it('writes the new name wherever the plan named the variable', () => {
    const [renamed] = planWithVariableRenamed({
      plan: [CASE],
      from: 'LOGIN_EMAIL',
      to: 'ADMIN_EMAIL',
    });

    expect(renamed).toEqual({
      ...CASE,
      title: 'Sign in as ${ADMIN_EMAIL}',
      goal: 'The ${ADMIN_EMAIL} account gets in.',
      preconditions: 'An account ${ADMIN_EMAIL} with ${LOGIN_PASSWORD}.',
      steps: [
        { action: 'Type ${ADMIN_EMAIL} in Email', expected: 'It reads ${ADMIN_EMAIL}' },
        { action: 'Type ${LOGIN_EMAIL_2} in Backup', expected: 'Saved' },
      ],
    });
  });

  it('does NOT touch a variable whose name only starts the same way', () => {
    const [renamed] = planWithVariableRenamed({
      plan: [CASE],
      from: 'LOGIN_EMAIL',
      to: 'ADMIN_EMAIL',
    });

    expect(renamed?.steps[1]?.action).toBe('Type ${LOGIN_EMAIL_2} in Backup');
  });

  /** Renomear uma variável descartava o frame do Figma de cada passo pelo caminho. */
  it('keeps the Figma frame each step names', () => {
    const [renamed] = planWithVariableRenamed({
      plan: [
        {
          ...CASE,
          steps: [{ action: 'Type ${LOGIN_EMAIL}', expected: 'Ok', frame: '12:3' }],
        },
      ],
      from: 'LOGIN_EMAIL',
      to: 'ADMIN_EMAIL',
    });

    expect(renamed?.steps[0]).toEqual({
      action: 'Type ${ADMIN_EMAIL}',
      expected: 'Ok',
      frame: '12:3',
    });
  });
});

describe('planWithVariableRenamed, the account a case starts in', () => {
  it('renames the account a case starts signed in with', () => {
    const [renamed] = planWithVariableRenamed({
      plan: [{ ...CASE, signedInAs: 'LOGIN_EMAIL' }],
      from: 'LOGIN_EMAIL',
      to: 'ADMIN_EMAIL',
    });

    expect(renamed?.signedInAs).toBe('ADMIN_EMAIL');
  });

  it('does NOT touch another account', () => {
    const [renamed] = planWithVariableRenamed({
      plan: [{ ...CASE, signedInAs: 'SELLER_EMAIL' }],
      from: 'LOGIN_EMAIL',
      to: 'ADMIN_EMAIL',
    });

    expect(renamed?.signedInAs).toBe('SELLER_EMAIL');
  });
});
