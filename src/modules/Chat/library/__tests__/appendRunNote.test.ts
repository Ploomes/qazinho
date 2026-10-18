import { describe, expect, it } from 'vitest';
import { appendRunNote } from '@/modules/Chat/library';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

describe('appendRunNote', () => {
  it('keeps a note with the run it was left in', () => {
    const noted = appendRunNote({
      workspace: walkRun({ verdicts: ['passed'] }),
      text: '  I closed a banner first. ',
      who: 'Claude Code',
      at: '09:41',
    });

    expect(noted.chat.at(-1)).toMatchObject({
      kind: 'note',
      runId: 'r-01',
      who: 'Claude Code',
      text: 'I closed a banner first.',
    });
  });

  it('writes a note that came with no run going as the agent speaking', () => {
    const noted = appendRunNote({
      workspace: makeWorkspace(),
      text: 'Late word.',
      who: 'Claude Code',
      at: '09:41',
    });

    expect(noted.chat.at(-1)).toMatchObject({ kind: 'agent', text: 'Late word.' });
  });

  it('does NOT keep a note with nothing in it', () => {
    const running = walkRun({ verdicts: [] });

    expect(
      appendRunNote({ workspace: running, text: '   ', who: 'Claude Code', at: '09:41' }),
    ).toBe(running);
  });
});
