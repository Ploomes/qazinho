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
      text: 'The agent of w2 "Login" is still answering in its chat. You cannot send this later on your own: tell the QA to write it there once the agent is done, or to ask you again then.',
      isError: true,
    });
    expect(did).toEqual([]);
  });

  it('does NOT leave behind the questions its chat still waits on', () => {
    const asking = {
      ...LOGIN,
      chat: [
        {
          id: 'm-1',
          kind: 'questions' as const,
          at: '10:00',
          questions: [
            {
              header: 'Cadastro',
              question: 'Qual cadastro?',
              options: [
                { label: 'Newsletter', description: '' },
                { label: 'Conta', description: '' },
              ],
              isMultiSelect: false,
            },
          ],
          answers: null,
        },
      ],
    };
    const { port, did } = fakePort({ state: { workspaces: [asking] } });

    expect(performChatAsk({ call: ASK, port })).toEqual({
      text: 'The agent of w2 "Login" asked the QA a question in its chat that they have not answered yet, and a new message would leave it behind. Tell the QA to answer there: each question takes their own words too, where this request fits.',
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
