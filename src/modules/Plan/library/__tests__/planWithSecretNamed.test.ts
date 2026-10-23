import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { planWithSecretNamed } from '@/modules/Plan/library';

const CASE: ITestCase = {
  id: 'TC-01',
  title: 'Login with Teste-1234',
  priority: 'P1',
  goal: '',
  preconditions: 'The account takes Teste-1234',
  steps: [{ action: 'Type senha Teste-1234', expected: 'In', frame: '1:2' }],
  lastVerdict: null,
};

describe('planWithSecretNamed', () => {
  it('writes the variable wherever the plan wrote the secret, frames kept', () => {
    expect(
      planWithSecretNamed({ plan: [CASE], value: 'Teste-1234', name: 'PASSWORD' }),
    ).toEqual([
      {
        ...CASE,
        title: 'Login with ${PASSWORD}',
        preconditions: 'The account takes ${PASSWORD}',
        steps: [{ action: 'Type senha ${PASSWORD}', expected: 'In', frame: '1:2' }],
      },
    ]);
  });

  it('does NOT change a plan that never wrote it', () => {
    expect(
      planWithSecretNamed({ plan: [CASE], value: 'other-9', name: 'PASSWORD' }),
    ).toEqual([CASE]);
  });
});
