import { appendFile, mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { ChatDevices } from '@/main/classes/devices/ChatDevices';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { Harness, McpHost } from '@salve-software/qazinho-harness';
import { WebDriver, webAccessOf } from '@salve-software/qazinho-harness/engine';

const PORT = 4356;
const PASSWORD = 'Shop-Pass-4321';

/**
 * O painel de uma loja em três telas: o login com test ids, a lista de etiquetas e o
 * formulário de uma etiqueta nova. As palavras do app discordam das do QA ("Etiquetas de
 * produtos", "Nova etiqueta"), e o Salvar anota quando é apertado: o agente que só olha
 * nunca o aperta.
 */
const saves: string[] = [];
const paths: string[] = [];
const PAGES: Record<string, string> = {
  '/': `<h1>Painel</h1>
<label>E-mail <input data-testid="login-email" type="email"></label>
<label>Senha <input data-testid="login-password" type="password"></label>
<button data-testid="login-submit" onclick="
  const email = document.querySelector('[data-testid=login-email]').value;
  const password = document.querySelector('[data-testid=login-password]').value;
  if (email === 'qa@shop.test' && password === '${PASSWORD}') location.href = '/labels';
  else document.querySelector('#error').textContent = 'E-mail ou senha incorretos';
">Entrar</button><p id="error"></p>`,
  '/labels': `<nav><a href="/labels">Etiquetas</a></nav>
<h1>Etiquetas de produto</h1><ul><li>Etiqueta padrão</li></ul>
<button data-testid="new-label" onclick="location.href='/labels/new'">Nova etiqueta de produto</button>`,
  '/labels/new': `<h1>Nova etiqueta de produto</h1>
<label>Nome da etiqueta <input data-testid="label-name"></label>
<button data-testid="label-save" onclick="fetch('/save', { method: 'POST' })">Salvar</button>`,
};

const server = createServer((request, response) => {
  const path = (request.url ?? '/').split('?')[0] ?? '/';

  paths.push(path);

  if (path === '/save') saves.push(path);

  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html lang="pt"><body>${PAGES[path] ?? ''}</body></html>`);
});

let root = '';
let log = '';

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  root = await mkdtemp(join(tmpdir(), 'qazinho-learn-'));
  log = join(root, 'learn.log');
});

afterAll(() => {
  server.close();
});

describe('a real chat learning the app before it plans', () => {
  it('walks the app in its own browser, logs in by name, saves nothing, and asks', async () => {
    const command = (await new AgentDetector().detect()).find(
      (one) => one.id === 'claude-code',
    )?.path;

    expect(command, 'Claude Code must be installed for this suite').toBeDefined();

    const url = `http://127.0.0.1:${String(PORT)}/`;
    const values = [
      {
        name: 'SHOP_EMAIL',
        description: 'E-mail de login do painel',
        value: 'qa@shop.test',
      },
      { name: 'SHOP_PASSWORD', description: 'Senha do painel', value: PASSWORD },
    ];
    const calls: string[] = [];
    const changes: { streamUrl: string | null; address: string | null }[] = [];
    const live = new LiveStream();

    await live.start();

    const devices = new ChatDevices({
      profilesRoot: root,
      live,
      openDriver: (opened) =>
        new WebDriver({
          url: opened.url,
          profileDir: opened.profileDir,
          viewport: opened.viewport,
          access: webAccessOf(opened.values),
          onAddress: opened.onAddress,
        }),
      onChange: (change) => changes.push(change),
    });
    const tools = new McpHost();
    const harness = new Harness();

    await tools.start();

    const port = await devices.ready({
      workspaceId: 'w-learn',
      url,
      values,
      viewport: { width: 1280, height: 800 },
    });
    const watched = new Proxy(port, {
      get: (target, key) => {
        const value: unknown = Reflect.get(target, key);

        if (typeof value !== 'function') return value;

        return (...args: unknown[]) => {
          calls.push(`${String(key)} ${JSON.stringify(args).slice(0, 200)}`);

          return (value as (...given: unknown[]) => unknown).apply(target, args);
        };
      },
    });
    const scope = 'chat~w-learn';
    const chat = harness.chat({
      text:
        'Quero um plano de teste para criar uma etiqueta de produto no painel: entrar, ' +
        'abrir Etiquetas de produtos, clicar em "Nova etiqueta" e salvar uma etiqueta com ' +
        'um nome. O login está nas variáveis do projeto.',
      told: {},
      target: { kind: 'web', value: url },
      viewport: { width: 1280, height: 800 },
      steps: [],
      references: [],
      runs: [],
      look: null,
      code: null,
      story: null,
      page: null,
      design: null,
      variables: values.map(({ name, description }) => ({
        name,
        description,
        isSecret: name === 'SHOP_PASSWORD',
      })),
    });

    tools.attach({ workspaceId: scope, driver: watched, purpose: 'learn' });

    const runner = new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    });
    const turn = await runner.ask({
      workspaceId: 'w-learn',
      agentId: 'claude-code',
      command: command ?? 'claude',
      model: 'haiku',
      sessionId: null,
      prompt: chat.prompt,
      schema: chat.schema,
      systemPrompt: chat.systemPrompt,
      allowedTools: chat.tools.allowedTools,
      mcpConfig: tools.mcpConfigFor(scope, 120_000) ?? '',
    });
    const answer = harness.readChat(turn.text);

    tools.detach(scope);
    await devices.closeAll();
    tools.close();
    live.close();

    await appendFile(
      log,
      [
        `cost ${String(turn.costUsd)}`,
        `calls\n${calls.join('\n')}`,
        `paths ${paths.join(' ')}`,
        `saves ${String(saves.length)}`,
        `changes ${JSON.stringify(changes)}`,
        `answer ${JSON.stringify(answer, null, 2)}`,
      ].join('\n\n'),
    );

    expect(turn.isError).toBe(false);
    expect(calls.some((call) => call.startsWith('describe'))).toBe(true);
    expect(calls.some((call) => call.includes('"kind":"fill"'))).toBe(true);
    expect(paths).toContain('/labels');
    expect(saves).toHaveLength(0);
    expect(turn.text).not.toContain(PASSWORD);
    expect(answer?.reply ?? '').toMatch(/Nova etiqueta de produto/);
    expect(answer?.plan).toBeNull();
    expect(answer?.questions.length).toBeGreaterThan(0);
    expect(changes.some(({ streamUrl }) => streamUrl !== null)).toBe(true);
    expect(changes.at(-1)).toMatchObject({ streamUrl: null, address: null });
  }, 600_000);
});
