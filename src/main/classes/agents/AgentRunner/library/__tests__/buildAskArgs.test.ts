import { describe, expect, it } from 'vitest';
import { buildAskArgs } from '@/main/classes/agents/AgentRunner/library';

describe('buildAskArgs', () => {
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
    ]);
  });

  /**
   * A hook of the QA's own rewrote every command a build ran (rtk turns `./gradlew` into
   * `rtk gradlew`), so none matched the commands the build may run, and Gradle was refused.
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

    expect(args).toContain('--json-schema');
    expect(args.at(-1)).toBe('{"type":"object"}');
  });

  it('hands the harness its instructions once, as the system prompt', () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      systemPrompt: 'You test web apps.',
    });

    expect(args.slice(-2)).toEqual(['--append-system-prompt', 'You test web apps.']);
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

  /** The agent changing a team's suite edits files in its copy, and runs the tests only through QAzinho, which holds the secrets. */
  it('gives an agent its file tools on its folders and QAzinho own tools together', () => {
    expect(
      buildAskArgs({
        model: '',
        sessionId: null,
        mcpConfig: '{"mcpServers":{}}',
        tools: ['Read', 'Edit'],
        allowedTools: ['Read', 'Edit', 'mcp__qazinho'],
        readDirs: ['/data/suites/p-1/changes/c-01/work'],
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
      '/data/suites/p-1/changes/c-01/work',
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
});
