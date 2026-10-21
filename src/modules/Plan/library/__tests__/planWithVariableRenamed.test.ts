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
});
