import type { ChatMessage } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { lastSaidOf } from '@/modules/Chat/library';

const QUESTIONS: ChatMessage = {
  id: 'm-2',
  kind: 'questions',
  at: '10:34',
  questions: [],
  answers: null,
};

describe('lastSaidOf', () => {
  /** A anotação do guardião chegava depois da pergunta e travava a rodada aberta. */
  it('looks past the notes QAzinho adds beside the conversation', () => {
    expect(
      lastSaidOf([
        { id: 'm-1', kind: 'user', at: '10:33', text: 'O carrinho' },
        QUESTIONS,
        { id: 'm-3', kind: 'memory', at: '10:34', changes: [] },
        { id: 'm-4', kind: 'skills', at: '10:34', skills: [] },
      ] as ChatMessage[]),
    ).toBe(QUESTIONS);
  });

  it('is the newest message when it is part of the conversation', () => {
    const user: ChatMessage = { id: 'm-3', kind: 'user', at: '10:35', text: 'Pode' };

    expect(lastSaidOf([QUESTIONS, user])).toBe(user);
  });

  it('is nothing in a chat of notes only', () => {
    expect(
      lastSaidOf([
        { id: 'm-1', kind: 'memory', at: '10:34', changes: [] },
      ] as ChatMessage[]),
    ).toBeUndefined();
  });
});
