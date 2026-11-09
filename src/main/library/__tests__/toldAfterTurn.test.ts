import type { IAgentTurn } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { toldAfterTurn } from '@/main/library';

const TOLD = { 'The workspace': 'Loja' };
const TURN: IAgentTurn = {
  sessionId: 's-1',
  text: 'ok',
  usage: null,
  isError: false,
  costUsd: null,
};

describe('toldAfterTurn', () => {
  it('keeps what the session read after an ordinary turn', () => {
    expect(toldAfterTurn({ turn: TURN, told: TOLD })).toEqual(TOLD);
  });

  it('forgets it after a turn that compacted, so the next message tells it all again', () => {
    expect(toldAfterTurn({ turn: { ...TURN, wasCompacted: true }, told: TOLD })).toEqual(
      {},
    );
  });
});
