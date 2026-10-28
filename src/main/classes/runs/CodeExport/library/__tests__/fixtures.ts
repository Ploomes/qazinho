import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';
import type { IFlatStep } from '@/shared/types';

const step = (props: {
  number: number;
  action: string;
  expected: string;
}): IFlatStep => ({
  caseId: 'TC-01',
  caseTitle: 'Buy the second shirt',
  casePriority: 'P1',
  caseGoal: '',
  casePreconditions: '',
  numberInCase: props.number,
  action: props.action,
  expected: props.expected,
});

/** Um caso de três passos e a receita que uma run que passou gravou para ele. */
export const STEPS: IFlatStep[] = [
  step({ number: 1, action: 'Sign in', expected: 'The header says Sign out' }),
  step({
    number: 2,
    action: 'Buy the second shirt',
    expected: 'The cart reads 1 (R$ 79,90)',
  }),
  step({
    number: 3,
    action: 'Close the app and open it again',
    expected: 'The cart still reads 1',
  }),
];

export const RECIPE: ICaseRecipe = {
  caseId: 'TC-01',
  fingerprint: 'f',
  targetKind: 'web',
  runId: 'r-01',
  recordedAt: 0,
  steps: [
    {
      number: 1,
      actions: [
        { kind: 'fill', target: 'E-mail', value: 'qa@loja.test' },
        { kind: 'fill', target: 'Senha', value: 'Teste-1234' },
        { kind: 'press', target: 'Enter', value: '' },
      ],
      proof: 'Sair (qa@loja.test)',
    },
    {
      number: 2,
      actions: [
        { kind: 'click', target: 'button: Comprar #2', value: '' },
        { kind: 'click', target: 'Remover', value: '', dialog: 'cancel' },
        { kind: 'wait', target: '', value: '500' },
      ],
      proof: 'Carrinho 1 (R$ 79,90)',
    },
    {
      number: 3,
      actions: [{ kind: 'reopen', target: '', value: '' }],
      proof: 'Carrinho 1',
    },
  ],
};

/**
 * Um login gravado com as variáveis do projeto: a receita guarda os nomes delas, nunca os
 * valores.
 */
export const SIGN_IN: ICaseRecipe = {
  ...RECIPE,
  steps: [
    {
      number: 1,
      actions: [
        { kind: 'fill', target: 'E-mail', value: '${SHOP_EMAIL}' },
        { kind: 'fill', target: 'Senha', value: 'pre`fix ${SHOP_PASSWORD}' },
        { kind: 'press', target: 'Enter', value: '' },
      ],
      proof: 'Welcome, ${SHOP_EMAIL}.',
    },
  ],
};
