import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';

/**
 * Um agente cujo turno leva `seconds`, depois responde do jeito que o Claude Code termina
 * um.
 */
function slowAgent(seconds: number): string {
  const folder = mkdtempSync(join(tmpdir(), 'qazinho-runner-'));
  const command = join(folder, 'agent');

  writeFileSync(
    command,
    `#!/bin/sh\ncat > /dev/null\nsleep ${String(seconds)}\necho '{"type":"result","result":"done","is_error":false,"session_id":"s1"}'\n`,
  );
  chmodSync(command, 0o755);

  return command;
}

function runnerEndingTurnsAfter(timeoutMs: number): AgentRunner {
  return new AgentRunner({
    owners: new ProcessOwners(),
    folder: mkdtempSync(join(tmpdir(), 'qazinho-agent-home-')),
    onEvent: () => undefined,
    timeoutMs,
  });
}

const ask = (props: { runner: AgentRunner; command: string }) =>
  props.runner.ask({
    workspaceId: 'w1',
    meter: { kind: 'chat', workspaceId: null, projectId: null },
    agentId: 'claude-code',
    command: props.command,
    model: '',
    sessionId: null,
    prompt: 'Walk the case.',
  });

describe.skipIf(process.platform === 'win32')('AgentRunner', () => {
  describe('the servers of the QA', () => {
    const argsOf = async (isSealed: boolean) => {
      const folder = mkdtempSync(join(tmpdir(), 'qazinho-runner-'));
      const command = join(folder, 'agent');
      const log = join(folder, 'args');

      writeFileSync(
        command,
        `#!/bin/sh\nprintf '%s\\n' "$@" > '${log}'\ncat > /dev/null\necho '{"type":"result","result":"ok","is_error":false,"session_id":"s"}'\n`,
      );
      chmodSync(command, 0o755);

      await new AgentRunner({
        owners: new ProcessOwners(),
        folder: mkdtempSync(join(tmpdir(), 'qazinho-agent-home-')),
        onEvent: () => undefined,
        permissions: {
          tool: 'mcp__qazinho__approve',
          mcpConfig: () => '{"mcpServers":{}}',
        },
      }).ask({
        workspaceId: 'w1',
        meter: { kind: 'chat', workspaceId: null, projectId: null },
        agentId: 'claude-code',
        command,
        model: '',
        sessionId: null,
        prompt: 'Weigh it.',
        allowedTools: [],
        isSealed,
      });

      return readFileSync(log, 'utf8');
    };

    it('leaves them out of a sealed call', async () => {
      const args = await argsOf(true);

      expect(args).toContain('--strict-mcp-config');
      expect(args).not.toContain('--permission-prompt-tool');
    });

    it('lets them into any other call', async () => {
      expect(await argsOf(false)).toContain('--permission-prompt-tool');
    });
  });

  /** O QAzinho não tinha como dizer ao QA o que as chamadas dele gastaram. */
  it('tells what a turn spent, per model, for the work and the workspace it paid', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'qazinho-runner-'));
    const command = join(folder, 'agent');
    const result = {
      type: 'result',
      result: 'ok',
      is_error: false,
      session_id: 's',
      total_cost_usd: 0.01,
      modelUsage: {
        'claude-haiku-5-5': {
          inputTokens: 1200,
          outputTokens: 18,
          cacheReadInputTokens: 10835,
          cacheCreationInputTokens: 20725,
          costUSD: 0.01,
        },
      },
    };

    writeFileSync(
      command,
      `#!/bin/sh\ncat > /dev/null\necho '${JSON.stringify(result)}'\n`,
    );
    chmodSync(command, 0o755);

    const spent: unknown[] = [];

    await new AgentRunner({
      owners: new ProcessOwners(),
      folder: mkdtempSync(join(tmpdir(), 'qazinho-agent-home-')),
      onEvent: () => undefined,
      onSpent: (records) => spent.push(...records),
    }).ask({
      workspaceId: 'w1',
      meter: { kind: 'case', workspaceId: 'w1', projectId: 'p1' },
      agentId: 'claude-code',
      command,
      model: 'haiku',
      sessionId: null,
      prompt: 'Walk the case.',
    });

    expect(spent).toEqual([
      expect.objectContaining({
        agentId: 'claude-code',
        kind: 'case',
        workspaceId: 'w1',
        projectId: 'p1',
        model: 'claude-haiku-5-5',
        input: 1200,
        output: 18,
        cacheRead: 10835,
        cacheWrite: 20725,
        costUsd: 0.01,
      }),
    ]);
  });

  describe('the clock on a turn', () => {
    it('ends a turn that runs past its time', async () => {
      const turn = await ask({
        runner: runnerEndingTurnsAfter(300),
        command: slowAgent(3),
      });

      expect(turn.isError).toBe(true);
    });

    /**
     * O agente de uma run espera pelo QA dentro de uma chamada de ferramenta: os minutos
     * dele não são do turno.
     */
    it('does NOT end a turn while the workspace is held for the QA', async () => {
      const runner = runnerEndingTurnsAfter(300);

      runner.hold('w1');

      const turn = await ask({ runner, command: slowAgent(1) });

      expect(turn.isError).toBe(false);
      expect(turn.text).toBe('done');
    });

    it('gives a released turn only the time it had left', async () => {
      const runner = runnerEndingTurnsAfter(400);
      const began = Date.now();

      runner.hold('w1');
      setTimeout(() => {
        runner.release('w1');
      }, 800);

      const turn = await ask({ runner, command: slowAgent(4) });
      const took = Date.now() - began;

      expect(turn.isError).toBe(true);
      expect(took).toBeGreaterThan(1_000);
      expect(took).toBeLessThan(3_000);
    });

    it('starts the clock again only once every hold is released', async () => {
      const runner = runnerEndingTurnsAfter(300);

      runner.hold('w1');
      runner.hold('w1');
      setTimeout(() => {
        runner.release('w1');
      }, 100);

      const turn = await ask({ runner, command: slowAgent(1) });

      expect(turn.isError).toBe(false);
    });
  });
});
