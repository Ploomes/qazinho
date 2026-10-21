import type { IQuestionsMessage } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { openRoundOf } from '@/modules/Assistant/library';

const ROUND: IQuestionsMessage = {
  id: 'm-2',
  kind: 'questions',
  at: '10:00',
  questions: [
    {
      header: 'Cadastro',
      question: 'Qual cadastro o plano deve cobrir?',
      options: [
        { label: 'Newsletter', description: 'O e-mail da página inicial.' },
        { label: 'Criar conta', description: 'Nome, e-mail e senha.' },
      ],
      isMultiSelect: false,
    },
  ],
  answers: null,
};

const ASKED = { id: 'm-1', kind: 'user' as const, at: '10:00', text: 'Cria um plano' };

describe('openRoundOf', () => {
  it('gives the questions the chat still waits on', () => {
    expect(openRoundOf({ chat: [ASKED, ROUND] })).toEqual(ROUND.questions);
  });

  it('does NOT count a round the QA answered, or one a newer message left behind', () => {
    expect(
      openRoundOf({
        chat: [ASKED, { ...ROUND, answers: [{ picked: ['Newsletter'], text: '' }] }],
      }),
    ).toEqual([]);
    expect(openRoundOf({ chat: [ROUND, { ...ASKED, id: 'm-3' }] })).toEqual([]);
  });

  it('gives nothing for an empty chat', () => {
    expect(openRoundOf({ chat: [] })).toEqual([]);
  });
});
