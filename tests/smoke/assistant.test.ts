import type { AppToolCall, IAppSnapshot, IAppToolRequest } from '@/shared/types';
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { AppBridge } from '@/main/classes/assistant/AppBridge';
import { AssistantAgent } from '@/main/classes/assistant/AssistantAgent';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { Harness, McpHost } from '@ploomes/qazinho-harness';

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
 * O Claude Code como o assistente: lê as ferramentas do QAzinho do --mcp-config, renomeia
 * um workspace, depois apaga um, cuja resposta espera pelo QA, e diz com o que cada
 * chamada voltou. Ele anota as flags que recebeu e a config de MCP, timeout incluído.
 */
const ASSISTANT = (root: string) => `#!/usr/bin/env node
const fs = require('node:fs');
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv.slice(2);
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  const config = argv[argv.indexOf('--mcp-config') + 1];
  fs.writeFileSync(${JSON.stringify(join(root, 'argv.json'))}, JSON.stringify({ argv, config, prompt }));
  const url = JSON.parse(config).mcpServers.qazinho.url;
  const client = new Client({ name: 'fake-assistant', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(url)));
  const said = [];
  for (const [name, args] of [['rename_workspace', { workspace: 'Checkout', name: 'Pix' }], ['delete_workspace', { workspace: 'w2' }], ['run_plan', {}]]) {
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 600000 });
    said.push((result.isError ? 'ERROR ' : '') + result.content[0].text);
  }
  await client.close();
  fs.writeFileSync(${JSON.stringify(join(root, 'url.txt'))}, url);
  console.log(JSON.stringify({ type: 'result', result: said.join('\\n'), is_error: false, session_id: 's-1', total_cost_usd: 0.003 }));
});
`;

const APP: IAppSnapshot = {
  screen: 'home',
  openWorkspaceId: null,
  openTab: null,
  openRunId: null,
  openBugId: null,
  language: 'pt',
  theme: 'night',
  runAlert: 'system',
  agent: 'Claude Code',
  integrations: [],
  projects: [],
  workspaces: [],
};

/**
 * A página como a bridge a alcança: renomeia na hora, e segura um apagar até o QA
 * confirmar, aqui um pouco depois. Uma que nunca responde representa uma janela que ficou
 * calada.
 */
function fakePage(props: { isQuiet: boolean }) {
  const heard: AppToolCall[] = [];
  let bridge: AppBridge | null = null;

  const answer = (request: IAppToolRequest) => {
    const { id, call } = request;

    if (call.name === 'rename_workspace')
      bridge?.answer({
        id,
        text: `Renamed w1 from "${call.args.workspace}" to "${call.args.name}".`,
        isError: false,
      });
    else if (call.name === 'delete_workspace')
      setTimeout(() => {
        bridge?.answer({ id, text: 'Deleted w2 "Login".', isError: false });
      }, 1_500);
  };

  return {
    heard,
    connect: (bridged: AppBridge) => {
      bridge = bridged;
    },
    send: (request: IAppToolRequest) => {
      heard.push(request.call);

      if (!props.isQuiet) answer(request);

      return true;
    },
  };
}

const tools = new McpHost();
let root = '';
let agent = '';

beforeAll(async () => {
  await tools.start();
  root = await mkdtemp(join(tmpdir(), 'qazinho-assistant-'));
  agent = join(root, 'claude');
  await writeFile(agent, ASSISTANT(root));
  await chmod(agent, 0o755);
});

afterAll(() => {
  tools.close();
});

function assistantWith(props: { isQuiet: boolean; timeoutMs: number }) {
  const page = fakePage({ isQuiet: props.isQuiet });
  const bridge = new AppBridge({ send: page.send, timeoutMs: props.timeoutMs });

  page.connect(bridge);

  const assistant = new AssistantAgent({
    runner: new AgentRunner({
      owners: new ProcessOwners(),
      folder: join(root, 'home'),
      onEvent: () => undefined,
    }),
    tools,
    harness: new Harness(),
    bridge,
    findCommand: () => Promise.resolve(agent),
    kindOf: () => Promise.resolve(null),
    home: root,
  });

  return { assistant, page };
}

describe('the assistant through its own agent', () => {
  it('acts through the page, waits on a delete, and hears a call it got wrong', async () => {
    const { assistant, page } = assistantWith({ isQuiet: false, timeoutMs: 60_000 });
    const turn = await assistant.ask({
      agentId: 'claude-code',
      model: '',
      sessionId: null,
      text: 'Renomeia o Checkout para Pix e apaga o Login',
      app: APP,
    });

    expect(turn).toMatchObject({ isError: false, failure: null, sessionId: 's-1' });
    const [renamed, deleted, refused] = turn.text.split('\n');

    expect(renamed).toBe('Renamed w1 from "Checkout" to "Pix".');
    expect(deleted).toBe('Deleted w2 "Login".');
    expect(refused).toMatch(
      /^ERROR .*"run_plan" needs "workspace": its id or its name\./,
    );
    expect(page.heard.map(({ name }) => name)).toEqual([
      'rename_workspace',
      'delete_workspace',
    ]);
  }, 60_000);

  it('runs the agent with the app tools alone, each call allowed to wait on the QA', async () => {
    const { argv, config, prompt } = JSON.parse(
      await readFile(join(root, 'argv.json'), 'utf8'),
    ) as {
      argv: string[];
      config: string;
      prompt: string;
    };

    expect(argv).toEqual(
      expect.arrayContaining([
        '--strict-mcp-config',
        '--tools',
        '',
        '--allowedTools',
        'mcp__qazinho',
      ]),
    );
    expect(argv[argv.indexOf('--append-system-prompt') + 1]).toContain(
      '## Being the Estagiário',
    );
    expect(JSON.parse(config)).toMatchObject({
      mcpServers: { qazinho: { type: 'http', timeout: 360_000 } },
    });
    expect(prompt).toContain('## QAzinho now');
    expect(prompt.endsWith('Renomeia o Checkout para Pix e apaga o Login')).toBe(true);
  });

  it('takes the tools away once the turn ends', async () => {
    const url = await readFile(join(root, 'url.txt'), 'utf8');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });

    expect(response.status).toBe(404);
  });

  it('says nothing was done when the page never answers', async () => {
    const { assistant } = assistantWith({ isQuiet: true, timeoutMs: 500 });
    const turn = await assistant.ask({
      agentId: 'claude-code',
      model: '',
      sessionId: null,
      text: 'Renomeia o Checkout',
      app: APP,
    });

    expect(turn.text.split('\n').slice(0, 2)).toEqual([
      'ERROR QAzinho did not answer in time, so nothing was done.',
      'ERROR QAzinho did not answer in time, so nothing was done.',
    ]);
  }, 60_000);
});
