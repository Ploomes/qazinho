import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { writtenSecretsOf } from '@/modules/Plan/library';

function caseWith(id: string, action: string): ITestCase {
  return {
    id,
    title: 'Login',
    priority: 'P1',
    goal: '',
    preconditions: '',
    steps: [{ action, expected: 'It works' }],
    lastVerdict: null,
  };
}

describe('writtenSecretsOf', () => {
  /** What a QA moving from manual testing writes in a step. */
  it('finds a password written after the word, in Portuguese or English', () => {
    expect(
      writtenSecretsOf([
        caseWith('TC-01', 'Entrar com qa@loja.test e a senha Teste-1234'),
        caseWith('TC-02', 'Sign in with password: hunter2!'),
        caseWith('TC-03', 'Type the password "S3nh@forte".'),
      ]),
    ).toEqual([
      { value: 'Teste-1234', kind: 'password', caseId: 'TC-01' },
      { value: 'hunter2!', kind: 'password', caseId: 'TC-02' },
      { value: 'S3nh@forte', kind: 'password', caseId: 'TC-03' },
    ]);
  });

  it('finds a token the way the chat holds one back', () => {
    expect(
      writtenSecretsOf([
        caseWith('TC-01', 'Call the API with ghp_abcdefghijklmnopqrstuvwxyz0123'),
      ]),
    ).toEqual([
      { value: 'ghp_abcdefghijklmnopqrstuvwxyz0123', kind: 'token', caseId: 'TC-01' },
    ]);
  });

  it('does NOT take a word about a password for one', () => {
    expect(
      writtenSecretsOf([
        caseWith('TC-01', 'Digitar a senha errada'),
        caseWith('TC-02', 'Type ${LOGIN_PASSWORD} in the password field'),
        caseWith('TC-03', 'The password field shows its dots'),
        caseWith('TC-04', 'Esqueci a senha abre a recuperação'),
      ]),
    ).toEqual([]);
  });

  it('names a password written in two cases once, by the first', () => {
    expect(
      writtenSecretsOf([
        caseWith('TC-01', 'senha Teste-1234'),
        caseWith('TC-02', 'senha Teste-1234'),
      ]),
    ).toEqual([{ value: 'Teste-1234', kind: 'password', caseId: 'TC-01' }]);
  });
});
