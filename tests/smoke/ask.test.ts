import type { IVariableValue } from '@/main/types';
import type { IRunEvent, QaReply, RunAnswer } from '@/shared/types';
import { access, chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { Harness, McpHost } from '@salve-software/qazinho-harness';

const PORT = 4362;
const WAIT_MS = 1_500;

/** Um código mandado por texto ao celular do QA: chega à página, e nunca ao agente. */
const CODE = '48 21-zz';

/**
 * O app deixa um comprador escolher um plano, depois verifica o celular dele com o código
 * que mandou por texto.
 */
const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(`<!doctype html><html><body>
    <h1>Plans</h1>
    <button onclick="document.getElementById('plan').textContent = 'Picked ' + this.textContent">Premium</button>
    <button onclick="document.getElementById('plan').textContent = 'Picked ' + this.textContent">Premium+</button>
    <p id="plan">No plan yet</p>
    <label>Code <input id="code"></label>
    <button onclick="
      const isRight = document.getElementById('code').value === ${JSON.stringify(CODE).replace(/"/g, '&quot;')};
      document.getElementById('out').textContent = isRight ? 'Phone verified' : 'Wrong code';
    ">Verify</button>
    <p id="out">Not verified</p>
  </body></html>`);
});

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

/**
 * Anda o caso do jeito que o Claude Code andaria, perguntando ao QA o que o caso não diz,
 * e anota tudo o que o QAzinho lhe disse. `QZ_SCENARIO` escolhe até onde ele vai: o QA
 * responde, o QA nunca responde, ou o QA para a run enquanto ela espera.
 */
const agentScript = (heard: string) => `#!/usr/bin/env node
const fs = require('fs');
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv;
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  const hear = (text) => fs.appendFileSync(${JSON.stringify(heard)}, text + '\\n');
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  hear('tool timeout ' + config.mcpServers.qazinho.timeout);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  const call = async (name, args) => {
    const answer = await client.callTool({ name, arguments: args });
    const text = answer.content[0].text;
    hear(text);
    return text;
  };
  const scenario = process.env.QZ_SCENARIO;
  if (scenario === 'answer') {
    const plan = await call('ask_qa', { question: 'Which plan should I pick?', options: ['Premium', 'Premium+'] });
    await call('click', { target: plan.includes('Premium+') ? 'Premium+' : 'Premium' });
    await call('ask_qa', {
      question: 'What is the code texted to your phone?',
      secret: { name: 'OTP_CODE', description: 'The code texted to the QA' },
    });
    await call('fill', { target: 'Code', value: '\${OTP_CODE}' });
    const saw = await call('click', { target: 'Verify' });
    const isVerified = saw.includes('Phone verified');
    await call('report', {
      step: 1, verdict: isVerified ? 'passed' : 'failed', why: 'The phone answered.',
      got: isVerified ? 'Phone verified' : 'Wrong code', proof: 'Phone verified',
    });
  } else if (scenario === 'silent') {
    const said = await call('ask_qa', { question: 'Which plan should I pick?' });
    await call('report', { step: 1, verdict: 'blocked', why: said.split('.')[0], got: 'No plan picked' });
  } else {
    await call('ask_qa', { question: 'Which plan should I pick?' });
  }
  await client.close();
  console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1', total_cost_usd: 0.01 }));
});
`;

let root = '';
let heard = '';
let coordinator: RunCoordinator;
let events: IRunEvent[] = [];
let replies: QaReply[] = [];
let isStoppedOnAsk = false;
const kept: { projectId: string; variable: IVariableValue }[] = [];

async function run(props: { runId: string; scenario: string }) {
  events = [];
  process.env.QZ_SCENARIO = props.scenario;

  await coordinator.start({
    workspaceId: 'w-ask',
    projectId: 'p-ask',
    agentId: 'fake',
    model: '',
    target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
    runId: props.runId,
    language: 'en',
    steps: [
      {
        caseId: 'TC-01',
        caseTitle: 'Verify the phone',
        casePriority: 'P1',
        caseGoal: '',
        casePreconditions: '',
        numberInCase: 1,
        action: 'Pick a plan, then verify the phone with the code it texts',
        expected: 'Phone verified',
      },
    ],
  });

  return {
    asked: events.flatMap((event) => (event.kind === 'asked' ? [event.question] : [])),
    answers: events.flatMap((event): RunAnswer[] =>
      event.kind === 'answered' ? [event.asked.answer] : [],
    ),
    steps: events.flatMap((event) =>
      event.kind === 'step' ? [`${event.outcome.verdict} ${event.outcome.got}`] : [],
    ),
  };
}

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  root = await mkdtemp(join(tmpdir(), 'qazinho-ask-'));
  heard = join(root, 'heard.log');
  await mkdir(join(root, 'workspaces', 'w-ask'), { recursive: true });

  const agent = join(root, 'agent');

  await writeFile(agent, agentScript(heard));
  await chmod(agent, 0o755);

  const tools = new McpHost();

  await tools.start();
  coordinator = new RunCoordinator({
    runner: new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    }),
    findAndroid: async () => null,
    findIos: async () => null,
    findCommand: async () => agent,
    live: new LiveStream(),
    tools,
    harness: new Harness(),
    dataRoot: root,
    askWaitMs: WAIT_MS,
    keepVariable: async (keeping) => {
      kept.push(keeping);

      return true;
    },
    onEvent: (event) => {
      events.push(event);

      if (event.kind !== 'asked') return;

      const reply = replies.shift();

      setTimeout(() => {
        if (isStoppedOnAsk) coordinator.stop(event.workspaceId);
        else if (reply !== undefined)
          coordinator.answer({
            workspaceId: event.workspaceId,
            questionId: event.question.id,
            reply,
          });
      }, 300);
    },
  });
});

beforeEach(async () => {
  replies = [];
  isStoppedOnAsk = false;
  kept.length = 0;
  await rm(heard, { force: true });
});

afterAll(() => {
  server.close();
  Reflect.deleteProperty(process.env, 'QZ_SCENARIO');
});

describe('the agent asking the QA mid-run', () => {
  it('hears the choice in words, and types a code it never sees', async () => {
    replies = [
      { kind: 'said', text: 'Premium+' },
      { kind: 'secret', value: CODE, isKept: false },
    ];

    const walked = await run({ runId: 'r-01', scenario: 'answer' });

    expect(walked.steps).toEqual(['passed Phone verified']);
    expect(
      walked.asked.map(({ question, options, isSecret }) => [
        question,
        options,
        isSecret,
      ]),
    ).toEqual([
      ['Which plan should I pick?', ['Premium', 'Premium+'], false],
      ['What is the code texted to your phone?', [], true],
    ]);
    expect(walked.answers).toEqual([
      { kind: 'said', text: 'Premium+' },
      { kind: 'secret', name: 'OTP_CODE', isKept: false },
    ]);

    const told = await readFile(heard, 'utf8');

    expect(told).toContain('The QA answered:\nPremium+');
    expect(told).toContain('write ${OTP_CODE} where it goes');
    expect(told).not.toContain(CODE);
    expect(JSON.stringify(events)).not.toContain(CODE);
  }, 120_000);

  /**
   * O QA deu o código só para esta run: um passeio sem agente não teria a quem perguntar.
   */
  it('keeps no recipe of a case that typed a secret given for this run only', async () => {
    await expect(
      access(join(root, 'workspaces', 'w-ask', 'recipes.json')),
    ).rejects.toThrow();
  });

  it("keeps the secret in the project's variables when the QA asks", async () => {
    replies = [
      { kind: 'said', text: 'Premium' },
      { kind: 'secret', value: CODE, isKept: true },
    ];

    const walked = await run({ runId: 'r-02', scenario: 'answer' });

    expect(walked.answers.at(-1)).toEqual({
      kind: 'secret',
      name: 'OTP_CODE',
      isKept: true,
    });
    expect(kept).toEqual([
      {
        projectId: 'p-ask',
        variable: {
          name: 'OTP_CODE',
          description: 'The code texted to the QA',
          value: CODE,
        },
      },
    ]);
  }, 120_000);

  it('goes on without an answer once the wait is over, and tells the agent so', async () => {
    const walked = await run({ runId: 'r-03', scenario: 'silent' });

    expect(walked.answers).toEqual([{ kind: 'unanswered' }]);
    expect(walked.steps).toEqual(['blocked No plan picked']);
    expect(await readFile(heard, 'utf8')).toContain(
      `tool timeout ${String(WAIT_MS + 60_000)}`,
    );
  }, 120_000);

  it('ends the wait when the QA stops the run, and walks nothing after', async () => {
    isStoppedOnAsk = true;

    const walked = await run({ runId: 'r-04', scenario: 'stop' });

    expect(walked.answers).toEqual([{ kind: 'stopped' }]);
    expect(walked.steps).toEqual([]);
    expect(events.at(-1)?.kind).toBe('done');
  }, 120_000);
});
