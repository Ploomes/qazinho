import type { IChatAnswer, ISaveSkill, ITeamSkill } from '@/shared/types';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { SkillLibrary } from '@/main/classes/skills/SkillLibrary';
import { SkillWriter } from '@/main/classes/skills/SkillWriter';
import { Harness } from '@ploomes/qazinho-harness';

/**
 * As skills do time do jeito que a main as entrega ao chat: guardadas pela SkillLibrary
 * numa pasta de verdade, lidas pelo forChat e descritas pelo harness, para o Claude Code
 * real (Haiku) do QA. Uma skill ligada para escrever casos tem de moldar o plano, e a que
 * o QA chamou pelo "/" tem de mandar na resposta daquela mensagem. As duas pedem uma coisa
 * que o agente nunca faria sozinho, para o teste saber que foi a skill.
 */
const PRIORITY: ISaveSkill = {
  id: null,
  name: 'case-priority',
  description: 'Ao escrever os casos de um plano',
  body: [
    '# A prioridade de cada caso',
    '',
    'Todo caso começa o título pela prioridade entre colchetes: [P1] para o que quebra',
    'uma venda, [P2] para o que atrapalha, [P3] para o resto.',
    '',
    'Exemplo: "[P1] Cupom válido aplica o desconto".',
  ].join('\n'),
  use: 'cases',
  projectIds: null,
  isOn: true,
  draftId: null,
};

const EDGES: ISaveSkill = {
  id: null,
  name: 'edges-list',
  description: 'Quando o QA pedir as bordas de um campo',
  body: [
    '# As bordas de um campo',
    '',
    'Responda só com uma lista das bordas do que o QA nomeou, cada item começando',
    'por BORDA: e uma linha só. Não escreva plano nem faça perguntas.',
  ].join('\n'),
  use: 'called',
  projectIds: null,
  isOn: true,
  draftId: null,
};

/** Três casos como um time os escreve, que o QA anexa para o agente tirar o formato deles. */
const EXAMPLES = [
  '# Casos do cupom',
  '',
  '## [P1] Cupom válido aplica o desconto',
  'Dado um carrinho com um produto de R$ 100,00',
  'Quando o cliente aplica o cupom LOJA10',
  'Então o total mostra R$ 90,00',
  '',
  '## [P2] Cupom vencido é recusado',
  'Dado um carrinho com um produto',
  'Quando o cliente aplica um cupom vencido',
  'Então o carrinho avisa que o cupom venceu e o total não muda',
  '',
  '## [P3] Campo de cupom vazio',
  'Dado um carrinho com um produto',
  'Quando o cliente aplica sem escrever um cupom',
  'Então o botão de aplicar fica desligado',
].join('\n');

let root = '';
let library: SkillLibrary;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'qazinho-skills-'));
  library = new SkillLibrary({
    root,
    home: root,
    github: { api: () => Promise.reject(new Error('no GitHub in this suite')) },
  });
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

async function agentCommand() {
  const command = (await new AgentDetector().detect()).find(
    (one) => one.id === 'claude-code',
  )?.path;

  expect(command, 'Claude Code must be installed for this suite').toBeDefined();

  return command ?? 'claude';
}

/**
 * O que um QA responderia para o plano sair: a confirmação de uma opção só é escolhida, e o
 * resto ele deixa o agente decidir, sem textos exatos que o teste não tem.
 */
function replyTo(answer: IChatAnswer) {
  const [only] = answer.questions;

  if (answer.questions.length === 1 && only?.options.length === 1)
    return only.options[0]?.label ?? '';

  return answer.questions.length === 0
    ? 'Write the plan now with what you have.'
    : 'Decide each of these yourself with the safest choice, then write the plan.';
}

function chatOf(props: {
  harness: Harness;
  text: string;
  told: Record<string, string>;
  skills: ITeamSkill[];
}) {
  return props.harness.chat({
    text: props.text,
    told: props.told,
    target: { kind: 'web', value: 'https://shop.test' },
    viewport: { width: 1280, height: 800 },
    steps: [],
    references: [],
    runs: [],
    look: null,
    code: null,
    story: null,
    page: null,
    design: null,
    variables: [],
    skills: props.skills,
  });
}

describe('the team skills, with a real agent', () => {
  it('writes the cases the way the skill on for cases says', async () => {
    const command = await agentCommand();
    const saved = await library.save(PRIORITY);

    expect(saved.isSaved).toBe(true);

    const skills = await library.forChat({
      projectId: 'p1',
      uses: ['cases'],
      calledId: null,
    });
    const harness = new Harness();
    const runner = new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    });
    const followed: string[][] = [];
    let answer: IChatAnswer | null = null;
    let sessionId: string | null = null;
    let told: Record<string, string> = {};
    let text = [
      'Write a short test plan, three cases at most, for the coupon field of the cart.',
      'The cart needs no login, and checking that an error shows is enough.',
    ].join(' ');

    for (let turnNumber = 0; turnNumber < 6; turnNumber += 1) {
      const chat = chatOf({ harness, text, told, skills });

      followed.push(chat.followed);

      const turn = await runner.ask({
        workspaceId: 'w-skills',
        meter: { kind: 'skill', workspaceId: null, projectId: null },
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

    const titles = answer?.plan?.cases.map(({ title }) => title) ?? [];

    /* A skill chega uma vez, na primeira mensagem, e não de novo enquanto não muda. */
    expect(followed[0]).toEqual(['case-priority']);
    expect(followed.slice(1).flat()).toEqual([]);
    expect(titles.length).toBeGreaterThan(0);

    for (const title of titles) expect(title).toMatch(/^\[P[1-3]\] /);
  }, 600_000);

  it('answers the way the skill the QA called says, on that message', async () => {
    const command = await agentCommand();
    const saved = await library.save(EDGES);

    if (!saved.isSaved) throw new Error('the called skill was not saved');

    const skills = await library.forChat({
      projectId: 'p1',
      uses: ['cases'],
      calledId: saved.skill.id,
    });
    const harness = new Harness();
    const runner = new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    });
    const chat = chatOf({
      harness,
      text: 'Follow the edges-list skill.\n\nThe coupon field of the cart.',
      told: {},
      skills,
    });
    const turn = await runner.ask({
      workspaceId: 'w-skills-called',
      meter: { kind: 'skill', workspaceId: null, projectId: null },
      agentId: 'claude-code',
      command,
      model: 'haiku',
      sessionId: null,
      prompt: chat.prompt,
      schema: chat.schema,
      systemPrompt: chat.systemPrompt,
      allowedTools: chat.tools.allowedTools,
      readDirs: chat.readDirs,
      tools: AGENT_RUN.readTools.split(','),
    });
    const answer = harness.readChat(turn.text);

    expect(chat.followed).toEqual(expect.arrayContaining(['edges-list']));
    expect(answer?.plan ?? null).toBeNull();
    expect(answer?.reply.match(/BORDA:/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  }, 300_000);

  it("writes a skill from the team's cases the QA attached", async () => {
    const command = await agentCommand();
    const example = join(root, 'casos-do-cupom.md');

    await writeFile(example, EXAMPLES);
    await library.attach({ draftId: 'd-smoke', paths: [example] });

    const writer = new SkillWriter({
      runner: new AgentRunner({
        owners: new ProcessOwners(),
        folder: tmpdir(),
        onEvent: () => undefined,
      }),
      harness: new Harness(),
      library,
      findCommand: () => Promise.resolve(command),
    });
    let sessionId: string | null = null;
    let text =
      'Escreva a skill de como o nosso time escreve os casos, pelo exemplo anexado.';
    let skill: { name: string; description: string; body: string } | null = null;

    for (let turnNumber = 0; turnNumber < 4 && skill === null; turnNumber += 1) {
      const written = await writer.ask({
        draftId: 'd-smoke',
        agentId: 'claude-code',
        model: 'haiku',
        sessionId,
        text,
        current: null,
        language: 'pt',
      });

      if (!written.isAnswered)
        throw new Error(`the writer did not answer: ${written.reason}`);

      sessionId = written.sessionId;
      skill = written.answer.skill;
      text = 'Decida você o que for mais seguro e escreva a skill.';
    }

    expect(skill?.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(skill?.description.length).toBeGreaterThan(0);
    expect(skill?.body).toMatch(/Dado|Given/);
    expect(skill?.body).toMatch(/P1/);
  }, 600_000);
});
