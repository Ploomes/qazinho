import type { IAgentRunner, IRunAgent } from './types';
import type { ICodexLine } from '@/main/types';
import type { IAgentEvent, IAgentTurn, IAgentUsage } from '@/shared/types';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { AGENT_RUN } from './constants';
import {
  buildAskArgs,
  buildCodexArgs,
  costOf,
  hearCodex,
  killTree,
  readAgentLine,
  retryOf,
  strictSchemaOf,
  toStructured,
  toText,
  toUsage,
} from './library';

/** Drives the QA's own agent CLI, Claude Code or Codex. QAzinho owns no model and holds no provider key. */
export class AgentRunner {
  private readonly onEvent: (event: IAgentEvent) => void;
  private readonly owners: IAgentRunner['owners'];
  private readonly folder: string;
  private readonly asking = new Map<string, Set<ChildProcess>>();

  public constructor(props: IAgentRunner) {
    this.onEvent = props.onEvent;
    this.owners = props.owners;
    this.folder = props.folder;
  }

  public async ask(props: IRunAgent): Promise<IAgentTurn> {
    const { command, prompt, workspaceId } = props;
    const isCodex = props.agentId === 'codex';
    const schemaFile =
      isCodex && props.schema !== undefined
        ? join(tmpdir(), `qazinho-schema-${randomUUID()}.json`)
        : null;

    if (schemaFile !== null && props.schema !== undefined)
      await writeFile(
        schemaFile,
        JSON.stringify(
          strictSchemaOf(JSON.parse(props.schema) as Record<string, unknown>),
        ),
      );

    await mkdir(this.folder, { recursive: true });

    const child = spawn(
      command,
      isCodex ? buildCodexArgs({ ...props, schemaFile }) : buildAskArgs(props),
      {
        cwd: this.folder,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      },
    );

    if (child.pid !== undefined)
      this.owners.claim({ pid: child.pid, workspaceId, kind: 'agent' });

    const asking = this.asking.get(workspaceId) ?? new Set<ChildProcess>();

    asking.add(child);
    this.asking.set(workspaceId, asking);

    child.stdin.write(prompt);
    child.stdin.end();

    const timeout = setTimeout(() => {
      killTree(child);
    }, AGENT_RUN.timeoutMs);

    let sessionId: string | null = props.sessionId;
    let usage: IAgentUsage | null = null;
    let result = '';
    let structured = '';
    let spoken = '';
    let isError = false;
    let costUsd: number | null = null;
    let stderr = '';

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const lines = createInterface({ input: child.stdout });

    lines.on('line', (line) => {
      const event = readAgentLine(line);

      if (!event) return;

      if (isCodex) {
        const heard = hearCodex({ line: event as unknown as ICodexLine, usage });

        sessionId = heard.sessionId ?? sessionId;

        if (heard.usage) {
          usage = heard.usage;
          this.onEvent({ kind: 'usage', workspaceId, usage });
        }

        if (heard.message !== undefined && heard.message.length > 0) {
          if (schemaFile !== null) structured = heard.message;
          else {
            spoken = spoken.length > 0 ? `${spoken}\n\n${heard.message}` : heard.message;
            result = heard.message;
            this.onEvent({ kind: 'text', workspaceId, text: heard.message });
          }
        }

        if (heard.ended?.isError === true) {
          isError = true;
          result = heard.ended.text;
          structured = '';
        }

        return;
      }

      sessionId = event.session_id ?? sessionId;

      const retry = retryOf(event);

      if (retry !== null) this.onEvent({ kind: 'retry', workspaceId, ...retry });

      if (event.type === 'rate_limit_event' || event.type === 'result') {
        usage = toUsage({ previous: usage, line: event });
        this.onEvent({ kind: 'usage', workspaceId, usage });
      }

      const answered = toStructured(event);

      if (answered.length > 0) structured = answered;

      const text = toText(event);

      if (text.length > 0) {
        spoken = spoken.length > 0 ? `${spoken}\n\n${text}` : text;
        this.onEvent({ kind: 'text', workspaceId, text });
      }

      if (event.type === 'result') {
        result = event.result ?? '';
        isError = event.is_error === true;
        costUsd = costOf(event);
      }
    });

    const code = await new Promise<number>((resolve) => {
      child.on('close', () => {
        if (schemaFile !== null) void rm(schemaFile, { force: true });
      });
      child.on('close', (status) => {
        clearTimeout(timeout);
        asking.delete(child);

        if (child.pid !== undefined) this.owners.release(child.pid);

        resolve(status ?? 1);
      });
    });

    const spokenOrError = spoken.length > 0 ? spoken : stderr.trim();
    const said = result.length > 0 ? result : spokenOrError;

    return {
      sessionId,
      text: structured.length > 0 ? structured : said,
      usage,
      isError: isError || code !== 0,
      costUsd,
    };
  }

  /** Interrupts the workspace's agent the way Ctrl+C does, so it still says what the turn cost, and ends it if it lingers. */
  public cancel(workspaceId: string): void {
    for (const child of this.asking.get(workspaceId) ?? []) {
      killTree(child, 'SIGINT');
      setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) killTree(child);
      }, AGENT_RUN.interruptGraceMs).unref();
    }
  }
}
