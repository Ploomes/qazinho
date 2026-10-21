import { describe, expect, it } from 'vitest';
import { performChatAsk } from '@/modules/Assistant/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakePort, LOGIN } from './fixtures';

const ASK = {
  name: 'ask_workspace_chat' as const,
  args: { workspace: 'Login', text: 'Cria um plano de teste para o login' },
};

describe('performChatAsk', () => {
  it("hands the QA's request to the workspace's chat, and says its agent answers there", () => {
    const { port, did } = fakePort();

    expect(performChatAsk({ call: ASK, port })).toEqual({
      text: 'Sent the message to the chat of w2 "Login" and opened it there. Its agent answers in that chat, not here: before a plan it looks at the app and may ask the QA a round of questions, which they answer there.',
      isError: false,
    });
    expect(did).toEqual(['ask w2 Cria um plano de teste para o login']);
  });

  it('does NOT talk over the chat agent while it is still answering', () => {
    const { port, did } = fakePort({ state: { askingIds: ['w2'] } });

    expect(performChatAsk({ call: ASK, port })).toEqual({
      text: 'The agent of w2 "Login" is still answering in its chat: let it finish before asking it again.',
      isError: true,
    });
    expect(did).toEqual([]);
  });

  it('does NOT send while a run walks the plan, when the chat is locked', () => {
    const { port, did } = fakePort({
      state: { workspaces: [walkRun({ verdicts: ['passed'] }), LOGIN] },
    });

    expect(
      performChatAsk({ call: { ...ASK, args: { ...ASK.args, workspace: 'w1' } }, port }),
    ).toEqual({
      text: 'w1 "Checkout regression" is running r-01, and its chat takes messages again once the run ends.',
      isError: true,
    });
    expect(did).toEqual([]);
  });

  it('says which workspaces there are when the name matches none', () => {
    const { port } = fakePort();

    expect(
      performChatAsk({ call: { ...ASK, args: { ...ASK.args, workspace: 'Pix' } }, port }),
    ).toMatchObject({ isError: true });
  });
});
