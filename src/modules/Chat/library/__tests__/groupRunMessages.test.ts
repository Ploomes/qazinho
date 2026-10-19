import type { ChatMessage } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { groupRunMessages } from '@/modules/Chat/library';

const shown = (message: ChatMessage) => ({ message, isNew: false });

const USER: ChatMessage = { id: 'm-1', kind: 'user', at: '09:40', text: 'Run it' };
const NOTE: ChatMessage = {
  id: 'm-2',
  kind: 'note',
  at: '09:41',
  runId: 'r-01',
  who: 'Claude Code',
  text: 'I closed a banner first.',
};
const FAILED: ChatMessage = {
  id: 'm-3',
  kind: 'verdict',
  at: '09:41',
  runId: 'r-01',
  verdict: 'failed',
  stepNumber: 2,
  action: 'Apply the coupon',
  expected: 'It is refused',
  got: 'It took 10% off',
};
const CARD: ChatMessage = {
  id: 'm-5',
  kind: 'run',
  at: '09:42',
  runId: 'r-01',
  passed: 1,
  failed: 1,
  endedBy: 'finished',
};

describe('groupRunMessages', () => {
  it('keeps what a run said together where it began, its card on top', () => {
    const items = groupRunMessages([USER, NOTE, FAILED, CARD].map(shown));

    expect(items.map(({ kind }) => kind)).toEqual(['message', 'run']);
    expect(items[1]).toMatchObject({ runId: 'r-01', at: '09:41', card: CARD });
    expect(
      items[1]?.kind === 'run' ? items[1].messages.map(({ message }) => message.id) : [],
    ).toEqual(['m-2', 'm-3']);
  });

  it('keeps a run in one place when the chat spoke in between', () => {
    const reply: ChatMessage = {
      id: 'm-4',
      kind: 'agent',
      at: '09:41',
      who: 'Claude Code',
      text: 'The plan has five cases.',
    };

    expect(
      groupRunMessages([NOTE, reply, FAILED].map(shown)).map((item) =>
        item.kind === 'run' ? `run ${String(item.messages.length)}` : item.message.id,
      ),
    ).toEqual(['run 2', 'm-4']);
  });

  it('leaves alone what no run said, a verdict saved before runs were kept together included', () => {
    const older: ChatMessage = { ...FAILED, runId: null };

    expect(groupRunMessages([USER, older].map(shown)).map(({ kind }) => kind)).toEqual([
      'message',
      'message',
    ]);
  });

  it('keeps a bug found on the side of a step with the run that found it', () => {
    const finding: ChatMessage = {
      id: 'm-6',
      kind: 'finding',
      at: '09:41',
      runId: 'r-01',
      bugId: 'BUG-02',
      title: 'Yearly price differs',
    };

    expect(groupRunMessages([NOTE, finding].map(shown)).map(({ kind }) => kind)).toEqual([
      'run',
    ]);
  });
});
