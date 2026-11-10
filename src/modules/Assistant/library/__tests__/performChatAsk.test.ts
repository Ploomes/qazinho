import { describe, expect, it } from 'vitest';
import { performChatAsk } from '@/modules/Assistant/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakePort, LOGIN } from './fixtures';

const ASK = {
  name: 'ask_workspace_chat' as const,
  args: { workspace: 'Login', text: 'Cria um plano de teste para o login' },
};

describe('performChatAsk', () => {
  it("hands the QA's request to the workspace's chat, and says its agent answers there", async () => {
    const { port, did } = fakePort();

    expect(await performChatAsk({ call: ASK, port })).toEqual({
      text: 'Sent the message to the chat of w2 "Login" and opened it there. Its agent answers in that chat, not here: before a plan it looks at the app and may ask the QA a round of questions, which they answer there.',
      isError: false,
    });
    expect(did).toEqual(['ask w2 Cria um plano de teste para o login']);
  });

  it('hands the request with the Figma design the plan is checked against', async () => {
    const { port, did } = fakePort();
    const done = await performChatAsk({
      call: {
        ...ASK,
        args: {
          ...ASK.args,
          figma: 'https://www.figma.com/design/AbC123/Shop?node-id=12-345',
        },
      },
      port,
    });

    expect(done.text).toContain(
      ', checked against the Figma design "Shop", and opened it',
    );
    expect(did).toEqual(['ask w2 Cria um plano de teste para o login against AbC123']);
  });

  it('does NOT send a request with a link that is not a Figma design', async () => {
    const { port, did } = fakePort();
    const done = await performChatAsk({
      call: { ...ASK, args: { ...ASK.args, figma: 'https://example.com/shop' } },
      port,
    });

    expect(done).toMatchObject({ isError: true });
    expect(done.text).toContain('is not a link to a Figma design');
    expect(did).toEqual([]);
  });

  it('does NOT talk over the chat agent while it is still answering', async () => {
    const { port, did } = fakePort({ state: { askingIds: ['w2'] } });

    expect(await performChatAsk({ call: ASK, port })).toEqual({
      text: 'The agent of w2 "Login" is still answering in its chat. You cannot send this later on your own: tell the QA to write it there once the agent is done, or to ask you again then.',
      isError: true,
    });
    expect(did).toEqual([]);
  });

  it('does NOT leave behind the questions its chat still waits on', async () => {
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

    expect(await performChatAsk({ call: ASK, port })).toEqual({
      text: 'The agent of w2 "Login" asked the QA a question in its chat that they have not answered yet, and a new message would leave it behind. Tell the QA to answer there: each question takes their own words too, where this request fits.',
      isError: true,
    });
    expect(did).toEqual([]);
  });

  it('does NOT send while a run walks the plan, when the chat is locked', async () => {
    const { port, did } = fakePort({
      state: { workspaces: [walkRun({ verdicts: ['passed'] }), LOGIN] },
    });

    expect(
      await performChatAsk({
        call: { ...ASK, args: { ...ASK.args, workspace: 'w1' } },
        port,
      }),
    ).toEqual({
      text: 'w1 "Checkout regression" is running r-01, and its chat takes messages again once the run ends.',
      isError: true,
    });
    expect(did).toEqual([]);
  });

  it('says which workspaces there are when the name matches none', async () => {
    const { port } = fakePort();

    expect(
      await performChatAsk({
        call: { ...ASK, args: { ...ASK.args, workspace: 'Pix' } },
        port,
      }),
    ).toMatchObject({ isError: true });
  });

  it('hands the chat the Jira story the plan comes from, found by its key', async () => {
    const { port, did } = fakePort();

    expect(
      await performChatAsk({
        call: { ...ASK, args: { ...ASK.args, story: 'SHOP-12' } },
        port,
      }),
    ).toEqual({
      text: 'Sent the message to the chat of w2 "Login", with the Jira story SHOP-12 "Aplicar cupom", and opened it there. Its agent answers in that chat, not here: before a plan it looks at the app and may ask the QA a round of questions, which they answer there.',
      isError: false,
    });
    expect(did).toEqual(['ask w2 Cria um plano de teste para o login from SHOP-12']);
  });

  it('does NOT send when Jira does not hand the story over, and says why', async () => {
    const { port, did } = fakePort();

    expect(
      await performChatAsk({
        call: { ...ASK, args: { ...ASK.args, story: 'SHOP-99' } },
        port,
      }),
    ).toEqual({
      text: 'SHOP-99: Jira did not find that story, or this account cannot see it.',
      isError: true,
    });
    expect(did).toEqual([]);
  });

  it('hands the chat the Confluence page the plan comes from, found by its title', async () => {
    const { port, did } = fakePort();

    expect(
      await performChatAsk({
        call: {
          ...ASK,
          args: { ...ASK.args, confluence: 'Checkout: cenários do cupom' },
        },
        port,
      }),
    ).toEqual({
      text: 'Sent the message to the chat of w2 "Login", with the Confluence page "Checkout: cenários do cupom", and opened it there. Its agent answers in that chat, not here: before a plan it looks at the app and may ask the QA a round of questions, which they answer there.',
      isError: false,
    });
    expect(did.at(-1)).toContain('from page 98304');
  });

  it('does NOT send while Confluence is off, and says where it is turned on', async () => {
    const { port, did } = fakePort();

    expect(
      await performChatAsk({
        call: { ...ASK, args: { ...ASK.args, confluence: 'off' } },
        port,
      }),
    ).toEqual({
      text: '"off": Confluence is off, so QAzinho cannot read the page. The QA turns it on beside Jira, with the switch in Jira\'s card in Settings → Connections.',
      isError: true,
    });
    expect(did).toEqual([]);
  });
});
