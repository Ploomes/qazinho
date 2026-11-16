import type { ChatItem, ChatMessage } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { groupOutsideTalks } from '@/modules/Chat/library';

const shown = (message: ChatMessage): ChatItem => ({
  kind: 'message',
  message,
  isNew: false,
});
const qa = (id: string): ChatMessage => ({ id, kind: 'user', at: '10:00', text: 'Hi' });
const outside = (id: string, readAt?: string): ChatMessage => ({
  id,
  kind: 'user',
  at: '10:01',
  text: 'Plan the checkout',
  from: 'agent',
  caller: 'claude-code',
  ...(readAt === undefined ? {} : { readAt }),
});
const answer = (id: string): ChatMessage => ({
  id,
  kind: 'agent',
  at: '10:02',
  who: 'Estagiário',
  text: 'Done.',
});

describe('groupOutsideTalks', () => {
  it('keeps what the coding agent wrote and every answer to it in one talk', () => {
    const items = groupOutsideTalks(
      [
        qa('m-1'),
        answer('m-2'),
        outside('m-3'),
        answer('m-4'),
        outside('m-5', '10:06'),
        answer('m-6'),
      ].map(shown),
    );

    expect(items.map((item) => item.kind)).toEqual(['message', 'message', 'talk']);
    expect(items[2]).toMatchObject({
      kind: 'talk',
      id: 'm-3',
      caller: 'claude-code',
      at: '10:01',
      readAt: '10:06',
    });
    expect(
      items[2]?.kind === 'talk' ? items[2].messages.map(({ message }) => message.id) : [],
    ).toEqual(['m-3', 'm-4', 'm-5', 'm-6']);
  });

  it('ends the talk when the QA writes, and when a run starts', () => {
    const run: ChatItem = {
      kind: 'run',
      runId: 'r-1',
      at: '10:05',
      messages: [],
      card: null,
      isNew: false,
    };
    const items = groupOutsideTalks([
      shown(outside('m-1')),
      shown(answer('m-2')),
      shown(qa('m-3')),
      shown(outside('m-4')),
      run,
      shown(answer('m-5')),
    ]);

    expect(items.map((item) => item.kind)).toEqual([
      'talk',
      'message',
      'talk',
      'run',
      'message',
    ]);
  });

  it('names an agent from before QAzinho knew who called as another', () => {
    const [talk] = groupOutsideTalks([
      shown({ id: 'm-1', kind: 'user', at: '9:00', text: 'Hi', from: 'agent' }),
    ]);

    expect(talk).toMatchObject({ kind: 'talk', caller: 'other', readAt: null });
  });
});
