import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { missingVariablesOf } from '@/modules/Plan/library';

const testCase = (props: Partial<ITestCase>): ITestCase => ({
  id: 'TC-01',
  title: 'Entrar',
  priority: 'P1',
  goal: '',
  preconditions: '',
  steps: [],
  lastVerdict: null,
  ...props,
});

describe('missingVariablesOf', () => {
  /**
   * O plano sugerido de uma exploração nomeava ${LOGIN_EMAIL}, que ninguém nunca guardou,
   * e cada run o pedia.
   */
  it('names what the plan types that the project does not keep, once each', () => {
    expect(
      missingVariablesOf({
        plan: [
          testCase({
            preconditions: 'Entrar com ${LOGIN_EMAIL} e ${LOGIN_PASSWORD}',
            steps: [
              {
                action: 'Digitar ${LOGIN_EMAIL} em E-mail',
                expected: 'O campo mostra o e-mail',
              },
              { action: 'Digitar ${SMS_CODE} no código', expected: 'A conta abre' },
            ],
          }),
        ],
        kept: ['LOGIN_PASSWORD'],
      }),
    ).toEqual(['LOGIN_EMAIL', 'SMS_CODE']);
  });

  it('has nothing to say when the project keeps them all, or the plan types none', () => {
    expect(
      missingVariablesOf({
        plan: [testCase({ steps: [{ action: 'Digitar ${A_B} aqui', expected: 'ok' }] })],
        kept: ['A_B'],
      }),
    ).toEqual([]);
    expect(
      missingVariablesOf({
        plan: [testCase({ steps: [{ action: 'Abrir $5 e {x}', expected: 'ok' }] })],
        kept: [],
      }),
    ).toEqual([]);
  });
});

describe('missingVariablesOf, the account a case starts in', () => {
  it('names the account a case starts in when the project does not keep it', () => {
    expect(
      missingVariablesOf({ plan: [testCase({ signedInAs: 'LOGIN_EMAIL' })], kept: [] }),
    ).toEqual(['LOGIN_EMAIL']);
    expect(
      missingVariablesOf({
        plan: [testCase({ signedInAs: 'LOGIN_EMAIL' })],
        kept: ['LOGIN_EMAIL'],
      }),
    ).toEqual([]);
  });
});
