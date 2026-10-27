import type { IAgentLogin } from './types';
import type {
  AgentSignInPhase,
  AgentSignInProgress,
  AgentSignInStep,
} from '@/shared/types';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { LinkCatcher } from '@/main/classes/agents/LinkCatcher';
import { authorizeUrlIn, stripAnsi, spawnCommand } from '@/main/library';
import { AGENT_LOGIN, LOGIN_RECIPES } from './constants';

/**
 * Signs the QA in to their own agent through the agent's own login: its page opens in the
 * browser, and the agent keeps the result.
 */
export class AgentLogin {
  private readonly findAgent: (agentId: string) => Promise<string | null>;
  private readonly openUrl: (url: string) => Promise<void>;
  private readonly onProgress: (progress: AgentSignInProgress) => void;
  private readonly folder: string;
  private readonly signIns = new Map<
    string,
    { controller: AbortController; child: ChildProcessWithoutNullStreams | null }
  >();

  public constructor(props: IAgentLogin) {
    this.findAgent = props.findAgent;
    this.openUrl = props.openUrl;
    this.onProgress = props.onProgress;
    this.folder = props.folder;
  }

  /**
   * Runs the agent's sign-in, reporting each step; resolves once the agent is signed in,
   * fails, or the QA cancels.
   */
  public async signIn(agentId: string): Promise<AgentSignInProgress> {
    const controller = new AbortController();
    const entry = { controller, child: null as ChildProcessWithoutNullStreams | null };

    this.cancel(agentId);
    this.signIns.set(agentId, entry);

    try {
      return await this.run({ agentId, entry });
    } finally {
      if (this.signIns.get(agentId) === entry) this.signIns.delete(agentId);
    }
  }

  /** Hands the agent the code its page showed, for a sign-in that falls back to one. */
  public sendCode(props: { agentId: string; code: string }): void {
    const code = props.code.trim();

    if (code !== '') this.signIns.get(props.agentId)?.child?.stdin.write(`${code}\n`);
  }

  /**
   * Stops a sign-in under way: the agent's login closes, and the sign-in ends cancelled.
   */
  public cancel(agentId: string): void {
    this.signIns.get(agentId)?.controller.abort();
  }

  /** Stops every sign-in under way, for when QAzinho quits. */
  public close(): void {
    for (const { controller } of this.signIns.values()) controller.abort();
  }

  private async run(props: {
    agentId: string;
    entry: { controller: AbortController; child: ChildProcessWithoutNullStreams | null };
  }): Promise<AgentSignInProgress> {
    const { agentId, entry } = props;
    const { signal } = entry.controller;
    const steps: AgentSignInStep[] = ['start', 'browser'];
    let takesCode = false;
    const report = (phase: AgentSignInPhase): AgentSignInProgress => {
      const progress = { agentId, steps, takesCode, ...phase };

      this.onProgress(progress);

      return progress;
    };

    report({ phase: 'working', at: 'start', url: null, opensAt: null });

    const recipe = LOGIN_RECIPES[agentId];
    const command = await this.findAgent(agentId);

    if (!recipe || command === null)
      return report({ phase: 'failed', at: 'start', failure: 'unsupported', said: '' });
    if (signal.aborted) return report({ phase: 'cancelled' });

    takesCode = recipe.takesCode;
    report({
      phase: 'working',
      at: 'start',
      url: null,
      opensAt: Date.now() + AGENT_LOGIN.headsUpMs,
    });
    await sleep(AGENT_LOGIN.headsUpMs, undefined, { signal }).catch(() => undefined);

    if (signal.aborted) return report({ phase: 'cancelled' });

    const catcher = await LinkCatcher.create();

    await mkdir(this.folder, { recursive: true });

    const child = spawnCommand({
      command: command,
      args: recipe.args,
      options: {
        cwd: this.folder,
        env: { ...process.env, ...catcher.env() },
      },
    });

    entry.child = child;
    child.stdin.on('error', () => undefined);

    return new Promise<AgentSignInProgress>((done) => {
      let printed = '';
      let url: string | null = null;
      let isDone = false;
      let printedPage: NodeJS.Timeout | null = null;
      const at = (): AgentSignInStep => (url === null ? 'start' : 'browser');
      const said = () => stripAnsi(printed).trim().slice(-AGENT_LOGIN.saidChars);
      const finish = (phase: AgentSignInPhase) => {
        if (isDone) return;

        isDone = true;
        clearInterval(look);
        clearTimeout(giveUp);
        if (printedPage !== null) clearTimeout(printedPage);
        signal.removeEventListener('abort', stop);
        child.kill();
        catcher.dispose();
        done(report(phase));
      };
      const stop = () => {
        finish({ phase: 'cancelled' });
      };
      const show = (link: string) => {
        url = link;
        report({ phase: 'working', at: 'browser', url: link, opensAt: null });
      };
      const look = setInterval(() => {
        void catcher.links().then((links) => {
          const link = links.at(-1);

          if (isDone || link === undefined || link === url) return;

          void this.openUrl(link);
          show(link);
        });
      }, AGENT_LOGIN.lookMs);
      const giveUp = setTimeout(() => {
        finish({ phase: 'failed', at: at(), failure: 'timeout', said: '' });
      }, AGENT_LOGIN.signInMs);
      const hear = (chunk: Buffer) => {
        printed += chunk.toString();

        const found = authorizeUrlIn(stripAnsi(printed));

        if (found === null || printedPage !== null) return;

        printedPage = setTimeout(() => {
          if (!isDone && url === null) show(found);
        }, AGENT_LOGIN.printedPageMs);
      };

      signal.addEventListener('abort', stop, { once: true });
      if (signal.aborted) stop();
      child.stdout.on('data', hear);
      child.stderr.on('data', hear);
      child.on('error', (error) => {
        finish({ phase: 'failed', at: at(), failure: 'closed', said: error.message });
      });
      child.on('close', (code) => {
        finish(
          code === 0
            ? { phase: 'connected' }
            : { phase: 'failed', at: at(), failure: 'refused', said: said() },
        );
      });
    });
  }
}
