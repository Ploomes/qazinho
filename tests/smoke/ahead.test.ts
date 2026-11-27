import type { IChatAnswer, IJiraStoryCopy, IPlanDoubt } from '@/shared/types';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { Harness } from '@ploomes/qazinho-harness';

/**
 * Uma história que ainda não chegou para teste, lida pelo Claude Code real (Haiku) do QA do
 * jeito que a main a entrega ao chat: com a prontidão dela e uma dúvida que o QA já mandou
 * ao time. O plano tem de sair da história sem o app: cada caso dizendo de qual critério
 * vem, o caso que depende da dúvida esperando por ela, e a estratégia escrita.
 */
const STORY: IJiraStoryCopy = {
  story: {
    key: 'SHOP-878',
    url: 'https://shop.atlassian.net/browse/SHOP-878',
    summary: 'Cupom de desconto no checkout',
    type: 'Story',
    status: 'In Progress',
    priority: 'High',
    labels: [],
    components: [],
    parent: '',
    description:
      'O cliente digita um cupom no checkout e o total cai pelo desconto do cupom. A mensagem de um cupom vencido ainda está sendo escrita pelo time de UX.',
    acceptance: [
      {
        field: 'Acceptance criteria',
        text: [
          '- Um cupom válido aplica o desconto ao total do pedido',
          '- Um cupom vencido mostra um aviso e o total não muda',
          '- O campo de cupom aceita no máximo um cupom por pedido',
        ].join('\n'),
      },
    ],
    comments: [],
    links: [],
    subtasks: [],
    attachments: [],
  },
  root: tmpdir(),
  files: [],
  readiness: 'ahead',
};

const DOUBTS: IPlanDoubt[] = [
  {
    id: 'D1',
    question: 'Qual é o texto exato do aviso de um cupom vencido?',
    sent: {
      url: 'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=100',
      at: '2026-11-13T13:00:00.000Z',
    },
    answer: null,
  },
];

async function agentCommand() {
  const command = (await new AgentDetector().detect()).find(
    (one) => one.id === 'claude-code',
  )?.path;

  expect(command, 'Claude Code must be installed for this suite').toBeDefined();

  return command ?? 'claude';
}

/**
 * O que um QA responderia para o plano sair: a confirmação de uma opção só é escolhida, e o
 * resto ele deixa o agente decidir.
 */
function replyTo(answer: IChatAnswer) {
  const [only] = answer.questions;

  if (answer.questions.length === 1 && only?.options.length === 1)
    return only.options[0]?.label ?? '';

  return answer.questions.length === 0
    ? 'Write the plan now with what you have.'
    : 'Decide each of these yourself with the safest choice, then write the plan.';
}

describe('a plan written ahead of the app, with a real agent', () => {
  it('names the criterion of each case, holds the one on the open doubt, and writes the strategy', async () => {
    const command = await agentCommand();
    const harness = new Harness();
    const runner = new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    });
    let answer: IChatAnswer | null = null;
    let sessionId: string | null = null;
    let told: Record<string, string> = {};
    let text =
      'Plan the tests for the Jira story SHOP-878: Cupom de desconto no checkout.';

    for (let turnNumber = 0; turnNumber < 6; turnNumber += 1) {
      const chat = harness.chat({
        text,
        told,
        target: { kind: 'web', value: 'https://shop.test' },
        viewport: { width: 1280, height: 800 },
        steps: [],
        references: [],
        runs: [],
        look: null,
        code: null,
        story: STORY,
        page: null,
        design: null,
        variables: [],
        skills: [],
        doubts: DOUBTS,
      });
      const turn = await runner.ask({
        workspaceId: 'w-ahead',
        meter: { kind: 'chat', workspaceId: null, projectId: null },
        agentId: 'claude-code',
        command,
        model: 'haiku',
        sessionId,
        prompt: chat.prompt,
        schema: chat.schema,
        systemPrompt: chat.systemPrompt,
        allowedTools: chat.tools.allowedTools,
        readDirs: chat.readDirs,
        tools: AGENT_RUN.readTools.split(','),
      });

      expect(turn.isError).toBe(false);

      answer = harness.readChat(turn.text);

      if (!answer || answer.plan !== null) break;

      sessionId = turn.sessionId;
      told = chat.told;
      text = replyTo(answer);
    }

    const cases = answer?.plan?.cases ?? [];
    const sources = cases.flatMap((one) => one.sources ?? []);

    expect(cases.length).toBeGreaterThan(0);
    expect(cases.every((one) => (one.sources ?? []).length > 0)).toBe(true);
    expect(sources.some((source) => /^C[1-3]\b/.test(source))).toBe(true);
    expect(cases.some((one) => (one.blockedBy ?? []).includes('D1'))).toBe(true);
    expect(answer?.plan?.strategy?.covers.trim().length ?? 0).toBeGreaterThan(0);
  }, 600_000);
});
