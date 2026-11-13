import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { gherkinOf } from '@/modules/Plan/library';

const WORDS = {
  language: 'pt',
  feature: 'Funcionalidade',
  scenario: 'Cenário',
  given: 'Dado',
  when: 'Quando',
  then: 'Então',
};

const CASE: ITestCase = {
  id: 'TC-02',
  title: 'Cupom vencido é recusado',
  priority: 'P1',
  goal: '',
  preconditions: 'Logado como ${LOGIN_EMAIL}',
  steps: [
    { action: 'Aplicar o cupom VERAO10, vencido', expected: 'Aparece "O cupom expirou"' },
    { action: 'Olhar o total', expected: '' },
  ],
  lastVerdict: null,
};

describe('gherkinOf', () => {
  it('writes each case as a scenario, the precondition as Given and each step as When and Then', () => {
    expect(gherkinOf({ name: 'Cupom no checkout', plan: [CASE], words: WORDS })).toBe(
      [
        '# language: pt',
        'Funcionalidade: Cupom no checkout',
        '',
        '  @P1',
        '  Cenário: TC-02 Cupom vencido é recusado',
        '    Dado Logado como ${LOGIN_EMAIL}',
        '    Quando Aplicar o cupom VERAO10, vencido',
        '    Então Aparece "O cupom expirou"',
        '    Quando Olhar o total',
      ].join('\n'),
    );
  });

  it('tags a case done by hand, and leaves out a precondition it does not have', () => {
    const text = gherkinOf({
      name: 'Cupom',
      plan: [{ ...CASE, preconditions: '', isManual: true, steps: [CASE.steps[0]!] }],
      words: WORDS,
    });

    expect(text).toContain('  @P1 @manual');
    expect(text).not.toContain('Dado');
  });
});
