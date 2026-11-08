import { describe, expect, it } from 'vitest';
import { talkAside } from '@/main/classes/runs/RunCoordinator/library/talkAside';

describe('talkAside', () => {
  it('quotes what the QA said and asks the agent to check it first', () => {
    const aside = talkAside(['the screen flickered on the header']);

    expect(aside).toContain('"the screen flickered on the header"');
    expect(aside).toContain('answer_qa');
    expect(aside).toContain('file it with bug');
  });

  it('lists several messages sent before the agent heard the first', () => {
    expect(talkAside(['one', 'two'])).toContain('- one\n- two');
  });
});
