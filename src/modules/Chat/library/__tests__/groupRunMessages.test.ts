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
    const items = groupRunMessages({
      messages: [USER, NOTE, FAILED, CARD].map(shown),
      runIds: ['r-01'],
    });

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
      groupRunMessages({
        messages: [NOTE, reply, FAILED].map(shown),
        runIds: ['r-01'],
      }).map((item) =>
        item.kind === 'run' ? `run ${String(item.messages.length)}` : item.message.id,
      ),
    ).toEqual(['run 2', 'm-4']);
  });

  it('leaves alone what no run said, a verdict saved before runs were kept together included', () => {
    const older: ChatMessage = { ...FAILED, runId: null };

    expect(
      groupRunMessages({ messages: [USER, older].map(shown), runIds: ['r-01'] }).map(
        ({ kind }) => kind,
      ),
    ).toEqual(['message', 'message']);
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

    expect(
      groupRunMessages({ messages: [NOTE, finding].map(shown), runIds: ['r-01'] }).map(
        ({ kind }) => kind,
      ),
    ).toEqual(['run']);
  });

  it('keeps a question the agent asked the QA with the run that asked it', () => {
    const asked: ChatMessage = {
      id: 'm-8',
      kind: 'ask',
      at: '09:41',
      runId: 'r-01',
      askId: 'q-1',
      question: 'Which plan should I pick?',
      caseId: 'TC-01',
      stepNumber: 2,
      answer: { kind: 'said', text: 'Premium+' },
    };

    expect(
      groupRunMessages({ messages: [USER, asked].map(shown), runIds: ['r-01'] }).map(
        (item) => (item.kind === 'run' ? item.messages.length : item.message.id),
      ),
    ).toEqual(['m-1', 1]);
  });

  it('leaves loose what a run that never walked a step said, such as why it could not start', () => {
    const broke: ChatMessage = {
      id: 'm-7',
      kind: 'error',
      runId: 'r-02',
      at: '09:50',
      text: 'Chrome could not open http://127.0.0.1:4999/.',
      detail: null,
      fix: null,
    };

    expect(
      groupRunMessages({
        messages: [NOTE, CARD, broke].map(shown),
        runIds: ['r-01'],
      }).map((item) => (item.kind === 'run' ? item.runId : item.message.id)),
    ).toEqual(['r-01', 'm-7']);
  });
});
