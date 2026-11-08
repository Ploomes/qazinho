import { describe, expect, it } from 'vitest';
import { buildAskArgs } from '@/main/classes/agents/AgentRunner/library';

describe('buildAskArgs', () => {
  it('asks for the words as they are written only when someone reads them live', () => {
    const flag = '--include-partial-messages';

    expect(buildAskArgs({ model: '', sessionId: null, isStreamed: true })).toContain(
      flag,
    );
    expect(buildAskArgs({ model: '', sessionId: null })).not.toContain(flag);
  });

  it('asks once, in json, on the model the QA picked', () => {
    const args = buildAskArgs({ model: 'sonnet', sessionId: null });

    expect(args).toEqual([
      '--print',
      '--output-format',
      'stream-json',
      '--verbose',
      '--settings',
      '{"disableAllHooks":true}',
      '--model',
      'sonnet',
      '--strict-mcp-config',
    ]);
  });

  /**
   * Sem isso o chat encontrava os servidores MCP do próprio QA: um da Atlassian oferecia
   * o Confluence, a chamada era recusada por falta de uma permissão que ninguém podia
   * dar, e o agente pedia ao QA que a desse.
   */
  it("keeps the QA's own MCP servers out of a call that names none of QAzinho's", () => {
    expect(buildAskArgs({ model: '', sessionId: null, allowedTools: [] })).toContain(
      '--strict-mcp-config',
    );
    expect(
      buildAskArgs({ model: '', sessionId: null, tools: ['Bash'], readDirs: ['/b'] }),
    ).toContain('--strict-mcp-config');
  });

  /**
   * Um hook do próprio QA reescrevia todo comando que um build rodava (o rtk transforma
   * `./gradlew` em `rtk gradlew`), então nenhum batia com os comandos que o build pode
   * rodar, e o Gradle era recusado.
   */
  it("keeps the QA's own hooks out of every call QAzinho makes", () => {
    const args = buildAskArgs({ model: '', sessionId: null, tools: ['Bash'] });

    expect(args[args.indexOf('--settings') + 1]).toBe('{"disableAllHooks":true}');
  });

  it('leaves the model to the agent when the QA kept its default', () => {
    const args = buildAskArgs({ model: '', sessionId: null });

    expect(args).not.toContain('--model');
  });

  it('carries on the session the workspace already has', () => {
    const args = buildAskArgs({ model: 'sonnet', sessionId: 'abc-123' });

    expect(args).toContain('--resume');
    expect(args[args.indexOf('--resume') + 1]).toBe('abc-123');
  });

  it('asks for a shape when the answer has to be a plan', () => {
    const args = buildAskArgs({
      model: 'sonnet',
      sessionId: null,
      schema: '{"type":"object"}',
    });

    expect(args[args.indexOf('--json-schema') + 1]).toBe('{"type":"object"}');
  });

  it('hands the harness its instructions once, as the system prompt', () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      systemPrompt: 'You test web apps.',
    });

    expect(args[args.indexOf('--append-system-prompt') + 1]).toBe('You test web apps.');
    expect(args.filter((arg) => arg === '--append-system-prompt')).toHaveLength(1);
  });

  it('gives the agent the tools the harness granted and takes every other tool away', () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      mcpConfig: '{"mcpServers":{}}',
      allowedTools: ['mcp__qazinho'],
    });

    expect(args.slice(-7)).toEqual([
      '--mcp-config',
      '{"mcpServers":{}}',
      '--strict-mcp-config',
      '--tools',
      '',
      '--allowedTools',
      'mcp__qazinho',
    ]);
  });

  /**
   * O agente que muda a suíte de um time edita arquivos na cópia dele, e roda os testes
   * só pelo QAzinho, que guarda os segredos.
   */
  it('gives an agent its file tools on its folders and QAzinho own tools together', () => {
    expect(
      buildAskArgs({
        model: '',
        sessionId: null,
        mcpConfig: '{"mcpServers":{}}',
        tools: ['Read', 'Edit'],
        allowedTools: ['Read', 'Edit', 'mcp__qazinho'],
        readDirs: ['/data/code/w-1/work'],
      }).slice(-11),
    ).toEqual([
      '--mcp-config',
      '{"mcpServers":{}}',
      '--strict-mcp-config',
      '--tools',
      'Read,Edit',
      '--allowedTools',
      'Read',
      'Edit',
      'mcp__qazinho',
      '--add-dir',
      '/data/code/w-1/work',
    ]);
  });

  it('does NOT restrict the agent tools when no device is attached', () => {
    expect(buildAskArgs({ model: '', sessionId: null })).not.toContain('--tools');
  });

  it('gives a build its tools, the commands it may run alone, and the folder it works in', () => {
    expect(
      buildAskArgs({
        model: '',
        sessionId: null,
        tools: ['Bash', 'Read', 'Write'],
        allowedTools: ['Bash(./gradlew:*)', 'Write'],
        readDirs: ['/builds/b1/src'],
      }).slice(-7),
    ).toEqual([
      '--tools',
      'Bash,Read,Write',
      '--allowedTools',
      'Bash(./gradlew:*)',
      'Write',
      '--add-dir',
      '/builds/b1/src',
    ]);
  });

  it('takes every tool away from a call that is only talk', () => {
    expect(
      buildAskArgs({ model: '', sessionId: null, allowedTools: [] }).slice(-2),
    ).toEqual(['--tools', '']);
  });

  it('lets a talk read, search and list the folders it was handed, and nothing else', () => {
    expect(
      buildAskArgs({
        model: '',
        sessionId: null,
        allowedTools: [],
        readDirs: ['/data/code/w-1'],
      }).slice(-4),
    ).toEqual(['--tools', 'Read,Grep,Glob', '--add-dir', '/data/code/w-1']);
  });

  it('does NOT hand a run the folders of a talk', () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      mcpConfig: '{"mcpServers":{}}',
      allowedTools: ['mcp__qazinho'],
      readDirs: ['/data/code/w-1'],
    });

    expect(args).not.toContain('--add-dir');
    expect(args).not.toContain('Read,Grep,Glob');
  });

  /**
   * O MCP da empresa do QA é dele para responder: o chat o usa, e o QAzinho concede cada
   * chamada.
   */
  it("lets the QA's own MCP servers into the chat, each call granted by QAzinho's tool", () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      mcpConfig: '{"mcpServers":{}}',
      allowedTools: ['mcp__qazinho'],
      permissionTool: 'mcp__qazinho__approve_permission',
    });

    expect(args).not.toContain('--strict-mcp-config');
    expect(args[args.indexOf('--permission-prompt-tool') + 1]).toBe(
      'mcp__qazinho__approve_permission',
    );
  });

  /**
   * O MCP da plataforma gasta os créditos da org: uma página sob teste nunca pode pedir ao
   * agente da run que rode o CI.
   */
  it("keeps the QA's org server away from the agents of QAzinho", () => {
    const args = buildAskArgs({
      model: 'haiku',
      sessionId: null,
      mcpConfig: '{}',
      allowedTools: ['mcp__qazinho'],
      permissionTool: 'mcp__qazinho__approve_permission',
    });

    expect(args[args.indexOf('--disallowedTools') + 1]).toBe('mcp__qazinho-org');
  });

  it('does NOT let them into a call with no tool to grant them', () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      mcpConfig: '{"mcpServers":{}}',
      allowedTools: ['mcp__qazinho'],
    });

    expect(args).toContain('--strict-mcp-config');
    expect(args).not.toContain('--permission-prompt-tool');
  });

  // A CLI recusa um --allowedTools sem valor antes de fazer qualquer coisa: uma chamada
  // sem ferramentas, passando pelas permissões, morria em silêncio (a revisão de um bug
  // e a memória do agente).
  it('names no allowed tools for a call that has none, under the permissions', () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      mcpConfig: '{"mcpServers":{}}',
      tools: [],
      allowedTools: [],
      permissionTool: 'mcp__qazinho__approve_permission',
    });

    expect(args).not.toContain('--allowedTools');
    expect(args[args.indexOf('--tools') + 1]).toBe('');
  });
});
