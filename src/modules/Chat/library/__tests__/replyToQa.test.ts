import { describe, expect, it } from 'vitest';
import { replyToQa } from '@/modules/Chat/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const EMPTY = makeWorkspace([]);

describe('replyToQa', () => {
  it('drafts the plan the first time, and hands it over as a card', () => {
    const workspace = replyToQa({ workspace: EMPTY, kind: 'web', at: '19:54' });

    expect(workspace.plan).toHaveLength(4);
    expect(workspace.chat.map(({ kind }) => kind)).toEqual(['agent', 'plan']);
  });

  it('never writes the plan into the chat as text', () => {
    const workspace = replyToQa({ workspace: EMPTY, kind: 'web', at: '19:54' });
    const card = workspace.chat.find((message) => message.kind === 'plan');

    expect(card).toMatchObject({ caseCount: 4, stepCount: 13 });
  });

  it('stops to ask about the SMS number on a build, and waits', () => {
    const workspace = replyToQa({ workspace: EMPTY, kind: 'mobile', at: '19:54' });

    expect(workspace.status).toBe('attention');
    expect(workspace.chat.at(-1)?.kind).toBe('ask');
  });

  it('does NOT draft a second plan once one exists', () => {
    const drafted = replyToQa({ workspace: EMPTY, kind: 'web', at: '19:54' });

    const again = replyToQa({ workspace: drafted, kind: 'web', at: '19:55' });

    expect(again.plan).toEqual(drafted.plan);
    expect(again.chat.at(-1)).toMatchObject({
      kind: 'agent',
      text: 'Noted. Hit Run plan when you want me to go, or tell me what to change first.',
    });
  });

  it('keeps the plan as it is once a run has happened', () => {
    const workspace = replyToQa({
      workspace: { ...makeWorkspace(), runs: [{ id: 'r-01' }] as never },
      kind: 'web',
      at: '19:55',
    });

    expect(workspace.chat.at(-1)).toMatchObject({
      text: 'Noted. I kept the plan as it is.',
    });
  });
});
