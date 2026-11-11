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

const QA: ChatMessage = { id: 'u-1', kind: 'user', at: '09:40', text: 'hi' };

describe('isFollowUp', () => {
  it('joins a reply to the one the same agent said right before', () => {
    expect(
      isFollowUp({ message: agent('Claude Code'), earlier: [agent('Claude Code')] }),
    ).toBe(true);
  });

  /** O mock do redesenho mostra o nome do agente uma vez na conversa, não a cada resposta. */
  it('keeps the name off a reply to the QA once the same agent said it', () => {
    expect(
      isFollowUp({ message: agent('Claude Code'), earlier: [agent('Claude Code'), QA] }),
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

    expect(isFollowUp({ message: note('n-2'), earlier: [note('n-1')] })).toBe(true);
  });

  it('does NOT join two agents, so a switch of agent keeps its name', () => {
    expect(
      isFollowUp({ message: agent('Codex'), earlier: [agent('Claude Code'), QA] }),
    ).toBe(false);
  });

  it('does NOT join the QA or a card, which never carry a name', () => {
    expect(isFollowUp({ message: QA, earlier: [agent('Claude Code')] })).toBe(false);
    expect(
      isFollowUp({
        message: agent('Claude Code'),
        earlier: [{ id: 'p-1', kind: 'plan', at: '09:40', caseCount: 2, stepCount: 6 }],
      }),
    ).toBe(false);
  });

  it('shows the name on the first message of the chat', () => {
    expect(isFollowUp({ message: agent('Claude Code'), earlier: [] })).toBe(false);
  });
});
