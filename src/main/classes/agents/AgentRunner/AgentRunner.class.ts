import type { IRunAgent } from './types';
import type { IAgentEvent, IAgentTurn, IAgentUsage } from '@/types';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { AGENT_RUN } from './constants';
import { buildAskArgs, readAgentLine, toText, toUsage } from './library';

/** Drives the QA's own agent CLI. gocrash owns no model and holds no provider key. */
export class AgentRunner {
  private readonly onEvent: (event: IAgentEvent) => void;

  public constructor(onEvent: (event: IAgentEvent) => void) {
    this.onEvent = onEvent;
  }

  public async ask(props: IRunAgent): Promise<IAgentTurn> {
    const { command, prompt, workspaceId } = props;
    const child = spawn(command, buildAskArgs(props), {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.stdin.write(prompt);
    child.stdin.end();

    const timeout = setTimeout(() => child.kill('SIGTERM'), AGENT_RUN.timeoutMs);

    let sessionId: string | null = props.sessionId;
    let usage: IAgentUsage | null = null;
    let result = '';
    let spoken = '';
    let isError = false;
    let stderr = '';

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const lines = createInterface({ input: child.stdout });

    lines.on('line', (line) => {
      const event = readAgentLine(line);

      if (!event) return;

      sessionId = event.session_id ?? sessionId;

      if (event.type === 'rate_limit_event' || event.type === 'result') {
        usage = toUsage({ previous: usage, line: event });
        this.onEvent({ kind: 'usage', workspaceId, usage });
      }

      const text = toText(event);

      if (text.length > 0) {
        spoken = spoken.length > 0 ? `${spoken}\n\n${text}` : text;
        this.onEvent({ kind: 'text', workspaceId, text });
      }

      if (event.type === 'result') {
        result = event.result ?? '';
        isError = event.is_error === true;
      }
    });

    const code = await new Promise<number>((resolve) => {
      child.on('close', (status) => {
        clearTimeout(timeout);
        resolve(status ?? 1);
      });
    });

    const spokenOrError = spoken.length > 0 ? spoken : stderr.trim();

    return {
      sessionId,
      text: result.length > 0 ? result : spokenOrError,
      usage,
      isError: isError || code !== 0,
    };
  }
}
