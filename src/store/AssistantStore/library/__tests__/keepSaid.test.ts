import type { AssistantMessage } from '@/modules/Assistant/types';
import { describe, expect, it } from 'vitest';
import { keepSaid } from '@/store/AssistantStore/library';

const ASKED: AssistantMessage[] = [{ kind: 'user', id: 'm-1', text: 'Apaga o Login' }];

describe('keepSaid', () => {
  it('keeps what the assistant said as a message before what it does next', () => {
    expect(
      keepSaid({ messages: ASKED, said: ' Vou pedir sua confirmação. ', id: 'm-2' }),
    ).toEqual([
      ...ASKED,
      { kind: 'agent', id: 'm-2', text: 'Vou pedir sua confirmação.' },
    ]);
  });

  it('does NOT keep nothing, nor the same words twice in a row', () => {
    expect(keepSaid({ messages: ASKED, said: '  ', id: 'm-2' })).toBe(ASKED);

    const kept = keepSaid({ messages: ASKED, said: 'Pronto.', id: 'm-2' });

    expect(keepSaid({ messages: kept, said: 'Pronto.', id: 'm-3' })).toBe(kept);
  });
});
