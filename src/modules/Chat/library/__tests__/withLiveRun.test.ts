import type { ChatItem } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { withLiveRun } from '@/modules/Chat/library';

const SAID: ChatItem = {
  kind: 'message',
  message: { id: 'm-1', kind: 'user', at: '09:40', text: 'hi' },
  isNew: false,
};

describe('withLiveRun', () => {
  it('gives a run that said nothing yet its line at the end', () => {
    expect(withLiveRun({ items: [SAID], liveId: 'r-02', at: '09:41' })).toEqual([
      SAID,
      { kind: 'run', runId: 'r-02', at: '09:41', messages: [], card: null, isNew: true },
    ]);
  });

  it('does NOT add a second line for a run that already has one', () => {
    const running: ChatItem = {
      kind: 'run',
      runId: 'r-02',
      at: '09:41',
      messages: [],
      card: null,
      isNew: false,
    };

    expect(withLiveRun({ items: [SAID, running], liveId: 'r-02', at: '09:41' })).toEqual([
      SAID,
      running,
    ]);
  });

  it('leaves the chat as it is with no run going', () => {
    const items = [SAID];

    expect(withLiveRun({ items, liveId: null, at: '' })).toBe(items);
  });
});
