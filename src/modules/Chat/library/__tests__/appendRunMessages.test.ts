import type { StepVerdict } from '@/types';
import { describe, expect, it } from 'vitest';
import { appendRunMessages } from '@/modules/Chat/library';
import {
  makeOutcome,
  makeWorkspace,
} from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = makeWorkspace();

function outcome(props: { index: number; verdict: StepVerdict }) {
  return makeOutcome({ workspace: WORKSPACE, ...props });
}

function walk(count: number) {
  let chat: typeof WORKSPACE.chat = [];

  for (let index = 0; index < count; index += 1)
    chat = appendRunMessages({
      workspace: { ...WORKSPACE, chat },
      outcome: outcome({ index, verdict: 'passed' }),
      at: '09:41',
    });

  return chat;
}

describe('appendRunMessages', () => {
  it('does NOT write anything for steps that went through', () => {
    expect(walk(3)).toEqual([]);
  });

  it('writes a verdict of its own when a step fails', () => {
    const chat = appendRunMessages({
      workspace: WORKSPACE,
      outcome: outcome({ index: 4, verdict: 'failed' }),
      at: '09:41',
    });

    expect(chat.at(-1)).toMatchObject({
      kind: 'verdict',
      verdict: 'failed',
      expected: 'An inline error asks for it',
      got: 'Nothing moved.',
    });
  });

  it('a step nobody could carry out gets a verdict too', () => {
    const chat = appendRunMessages({
      workspace: WORKSPACE,
      outcome: outcome({ index: 4, verdict: 'blocked' }),
      at: '09:41',
    });

    expect(chat.at(-1)).toMatchObject({ kind: 'verdict', verdict: 'blocked' });
  });

  it('does NOT write a verdict for a step that passed', () => {
    const chat = walk(2);

    expect(chat.some((message) => message.kind === 'verdict')).toBe(false);
  });

  it('does NOT write a verdict for a step the run skipped', () => {
    const chat = appendRunMessages({
      workspace: WORKSPACE,
      outcome: outcome({ index: 5, verdict: 'skipped' }),
      at: '09:41',
    });

    expect(chat.some((message) => message.kind === 'verdict')).toBe(false);
  });
});
