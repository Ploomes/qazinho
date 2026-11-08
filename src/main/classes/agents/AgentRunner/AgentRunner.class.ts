import type { IAgentClock, IAgentRunner, ILiveBlock, IRunAgent } from './types';
import type { ICodexLine } from '@/main/types';
import type { IAgentEvent, IAgentTurn, IAgentUsage } from '@/shared/types';
import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { spawnCommand } from '@/main/library';
import { AGENT_RUN } from './constants';
import {
  buildAskArgs,
  buildCodexArgs,
  codexConfigFileOf,
  codexServersOf,
  costOf,
  followPartial,
  hearCodex,
  killTree,
  readAgentLine,
  retryOf,
  strictSchemaOf,
  toActions,
  toStructured,
  toText,
  toToolCalls,
  toUsage,
  withPermissions,
} from './library';

/**
 * Dirige a CLI do próprio agente do QA, Claude Code ou Codex. O QAzinho não tem modelo e
 * não guarda chave de provedor.
 */
export class AgentRunner {
  private readonly onEvent: (event: IAgentEvent) => void;
  private readonly owners: IAgentRunner['owners'];
  private readonly folder: string;
  private readonly timeoutMs: number;
  private readonly permissions: IAgentRunner['permissions'];
  private readonly asking = new Map<string, Set<ChildProcess>>();
  private readonly clocks = new Map<ChildProcess, IAgentClock>();
  private readonly holds = new Map<string, number>();

  public constructor(props: IAgentRunner) {
    this.onEvent = props.onEvent;
    this.owners = props.owners;
    this.folder = props.folder;
    this.timeoutMs = props.timeoutMs ?? AGENT_RUN.timeoutMs;
    this.permissions = props.permissions;
  }

  /**
   * Pergunta ao agente uma vez; toda chamada deixa entrar os servidores MCP do próprio
   * QA, cada permissão de que precisam respondida pelo QAzinho.
   */
  public async ask(asked: IRunAgent): Promise<IAgentTurn> {
    const props =
      this.permissions === undefined
        ? asked
        : withPermissions({
            call: asked,
            permissions: {
              tool: this.permissions.tool,
              mcpConfig: this.permissions.mcpConfig(),
            },
          });
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

    const ownServers = isCodex
      ? codexServersOf(
          await readFile(
            codexConfigFileOf({ env: { ...process.env, ...props.env }, home: homedir() }),
            'utf8',
          ).catch(() => ''),
        )
      : [];
    const child = spawnCommand({
      command,
      args: isCodex
        ? buildCodexArgs({ ...props, schemaFile, ownServers })
        : buildAskArgs(props),
      options: {
        cwd: this.folder,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
        ...(props.env === undefined ? {} : { env: { ...process.env, ...props.env } }),
      },
    });

    if (child.pid !== undefined)
      this.owners.claim({ pid: child.pid, workspaceId, kind: 'agent' });

    const asking = this.asking.get(workspaceId) ?? new Set<ChildProcess>();

    asking.add(child);
    this.asking.set(workspaceId, asking);

    child.stdin.write(prompt);
    child.stdin.end();

    this.clocks.set(child, { timer: null, leftMs: this.timeoutMs, since: Date.now() });

    if (!this.holds.has(workspaceId)) this.startClock(child);

    let sessionId: string | null = props.sessionId;
    let usage: IAgentUsage | null = null;
    let result = '';
    let structured = '';
    let spoken = '';
    let live: ILiveBlock | null = null;
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

        if (heard.action !== undefined)
          this.onEvent({ kind: 'action', workspaceId, text: heard.action });

        if (heard.tool !== undefined)
          this.onEvent({ kind: 'tool', workspaceId, ...heard.tool });

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

      if (props.isStreamed === true) {
        const followed = followPartial({ line: event, block: live });

        live = followed.block;

        if (followed.said !== null)
          this.onEvent({ kind: 'text', workspaceId, text: followed.said });
      }

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

      for (const action of toActions(event))
        this.onEvent({ kind: 'action', workspaceId, text: action });

      for (const call of toToolCalls(event))
        this.onEvent({ kind: 'tool', workspaceId, ...call });

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
        this.stopClock(child);
        this.clocks.delete(child);
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

  /**
   * Interrompe o agente do workspace como o Ctrl+C faz, para ele ainda dizer quanto o
   * turno custou, e o termina se ele demorar.
   */
  public cancel(workspaceId: string): void {
    for (const child of this.asking.get(workspaceId) ?? []) {
      killTree(child, 'SIGINT');
      setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) killTree(child);
      }, AGENT_RUN.interruptGraceMs).unref();
    }
  }

  /**
   * Para o relógio que termina o agente do workspace enquanto ele espera pelo QA, até
   * haver tantas chamadas de `release`: a espera não é tempo do turno dele.
   */
  public hold(workspaceId: string): void {
    const holds = this.holds.get(workspaceId) ?? 0;

    this.holds.set(workspaceId, holds + 1);

    if (holds > 0) return;

    for (const child of this.asking.get(workspaceId) ?? []) this.stopClock(child);
  }

  /**
   * Liga o relógio de novo assim que nada o segura, com o tempo que sobrava ao agente.
   */
  public release(workspaceId: string): void {
    const holds = (this.holds.get(workspaceId) ?? 0) - 1;

    if (holds > 0) {
      this.holds.set(workspaceId, holds);

      return;
    }

    this.holds.delete(workspaceId);

    for (const child of this.asking.get(workspaceId) ?? []) this.startClock(child);
  }

  private startClock(child: ChildProcess): void {
    const clock = this.clocks.get(child);

    if (clock === undefined || clock.timer !== null) return;

    this.clocks.set(child, {
      timer: setTimeout(
        () => {
          killTree(child);
        },
        Math.max(clock.leftMs, 0),
      ),
      leftMs: clock.leftMs,
      since: Date.now(),
    });
  }

  private stopClock(child: ChildProcess): void {
    const clock = this.clocks.get(child);

    if (clock?.timer === undefined || clock.timer === null) return;

    clearTimeout(clock.timer);
    this.clocks.set(child, {
      timer: null,
      leftMs: clock.leftMs - (Date.now() - clock.since),
      since: Date.now(),
    });
  }
}
