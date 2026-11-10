import type { ChatMessage } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { isFollowUp } from '@/modules/Chat/library/isFollowUp';

const agent = (who: string): ChatMessage => ({
  id: `a-${who}`,
  kind: 'agent',
  at: '09:41',
  who,
  text: 'ok',
});

describe('isFollowUp', () => {
  it('joins a reply to the one the same agent said right before', () => {
    expect(
      isFollowUp({ message: agent('Claude Code'), previous: agent('Claude Code') }),
    ).toBe(true);
  });

  it('joins a note of a run to the note before it', () => {
    const note = (id: string): ChatMessage => ({
      id,
      kind: 'note',
      at: '09:41',
      runId: 'r-01',
      who: 'Claude Code',
      text: 'x',
    });

    expect(isFollowUp({ message: note('n-2'), previous: note('n-1') })).toBe(true);
  });

  it('does NOT join two agents, so a switch of agent keeps its name', () => {
    expect(isFollowUp({ message: agent('Codex'), previous: agent('Claude Code') })).toBe(
      false,
    );
  });

  it('does NOT join a reply to what the QA or a card said before it', () => {
    expect(
      isFollowUp({
        message: agent('Claude Code'),
        previous: { id: 'u-1', kind: 'user', at: '09:40', text: 'hi' },
      }),
    ).toBe(false);
    expect(
      isFollowUp({
        message: agent('Claude Code'),
        previous: { id: 'p-1', kind: 'plan', at: '09:40', caseCount: 2, stepCount: 6 },
      }),
    ).toBe(false);
  });

  it('shows the face on the first message of the chat', () => {
    expect(isFollowUp({ message: agent('Claude Code'), previous: null })).toBe(false);
  });
});
