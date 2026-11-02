import type { IIslandQuestion } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { questionKeyOf } from '@/modules/Island/screens/Island/library';

const QUESTION: IIslandQuestion = {
  workspaceId: 'w1',
  questionId: 'q-1',
  project: 'Loja',
  workspace: 'Compra',
  question: 'Qual tamanho?',
  options: [],
  isSecret: false,
};

describe('questionKeyOf', () => {
  it('tells apart the same question id in two workspaces', () => {
    expect(questionKeyOf(QUESTION)).not.toBe(
      questionKeyOf({ ...QUESTION, workspaceId: 'w2' }),
    );
  });

  it('does not change with what the question says', () => {
    expect(questionKeyOf(QUESTION)).toBe(
      questionKeyOf({ ...QUESTION, question: 'Outra coisa' }),
    );
  });
});
