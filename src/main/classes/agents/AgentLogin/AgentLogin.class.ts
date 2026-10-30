import type { IAgentLogin, ILoginRecipe } from './types';
import type {
  AgentSignInPhase,
  AgentSignInProgress,
  AgentSignInStep,
} from '@/shared/types';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { isSignedInOf, statusOf } from '@/main/classes/agents/AgentDetector/library';
import { terminalScriptOf } from '@/main/library';
import { AGENT_LOGIN, LOGIN_RECIPES } from './constants';

/**
 * Faz o QA entrar no próprio agente num terminal que ele vê, com o login do próprio
 * agente, e confere o status do agente até ele entrar.
 */
export class AgentLogin {
  private readonly findAgent: IAgentLogin['findAgent'];
  private readonly openScript: IAgentLogin['openScript'];
  private readonly onProgress: IAgentLogin['onProgress'];
  private readonly folder: string;
  private readonly platform: NodeJS.Platform;
  private readonly signIns = new Map<string, AbortController>();

  public constructor(props: IAgentLogin) {
    this.findAgent = props.findAgent;
    this.openScript = props.openScript;
    this.onProgress = props.onProgress;
    this.folder = props.folder;
    this.platform = props.platform ?? process.platform;
  }

  /**
   * Abre o login do agente num terminal e relata cada passo; resolve assim que o agente
   * diz que entrou, o tempo acaba, ou o QA cancela.
   */
  public async signIn(agentId: string): Promise<AgentSignInProgress> {
    const controller = new AbortController();

    this.cancel(agentId);
    this.signIns.set(agentId, controller);

    try {
      return await this.run({ agentId, signal: controller.signal });
    } finally {
      if (this.signIns.get(agentId) === controller) this.signIns.delete(agentId);
    }
  }

  /** Para de esperar um login: o terminal fica com o QA, e o login termina cancelado. */
  public cancel(agentId: string): void {
    this.signIns.get(agentId)?.abort();
  }

  /** Para de esperar todo login, para quando o QAzinho fecha. */
  public close(): void {
    for (const controller of this.signIns.values()) controller.abort();
  }

  private async run(props: {
    agentId: string;
    signal: AbortSignal;
  }): Promise<AgentSignInProgress> {
    const { agentId, signal } = props;
    const steps: AgentSignInStep[] = ['start', 'browser'];
    const report = (phase: AgentSignInPhase): AgentSignInProgress => {
      const progress = { agentId, steps, ...phase };

      this.onProgress(progress);

      return progress;
    };

    report({ phase: 'working', at: 'start', opensAt: null });

    const recipe = LOGIN_RECIPES[agentId];
    const command = await this.findAgent(agentId);

    if (!recipe || command === null)
      return report({ phase: 'failed', at: 'start', failure: 'unsupported', said: '' });

    report({
      phase: 'working',
      at: 'start',
      opensAt: Date.now() + AGENT_LOGIN.headsUpMs,
    });
    await sleep(AGENT_LOGIN.headsUpMs, undefined, { signal }).catch(() => undefined);

    if (signal.aborted) return report({ phase: 'cancelled' });
    if (!(await this.openScript(await this.scriptOf({ command, recipe }))))
      return report({
        phase: 'failed',
        at: 'start',
        failure: 'terminal',
        said: [command, ...recipe.login].join(' '),
      });

    report({ phase: 'working', at: 'browser', opensAt: null });

    const deadline = Date.now() + AGENT_LOGIN.signInMs;

    while (!signal.aborted && Date.now() < deadline) {
      await sleep(AGENT_LOGIN.pollMs, undefined, { signal }).catch(() => undefined);

      if (signal.aborted) break;

      const status = await statusOf({ command, args: recipe.status.args });

      if (isSignedInOf({ reads: recipe.status.reads, ...status }) === true)
        return report({ phase: 'connected' });
    }

    return signal.aborted
      ? report({ phase: 'cancelled' })
      : report({ phase: 'failed', at: 'browser', failure: 'timeout', said: '' });
  }

  private async scriptOf(props: {
    command: string;
    recipe: ILoginRecipe;
  }): Promise<string> {
    const { scriptExtensions } = AGENT_LOGIN;
    const extension =
      this.platform === 'darwin'
        ? scriptExtensions.darwin
        : this.platform === 'win32'
          ? scriptExtensions.win32
          : scriptExtensions.other;
    const script = join(tmpdir(), `${AGENT_LOGIN.scriptName}${extension}`);

    await mkdir(this.folder, { recursive: true });
    await writeFile(
      script,
      terminalScriptOf({
        command: props.command,
        args: props.recipe.login,
        folder: this.folder,
        say: AGENT_LOGIN.say,
        platform: this.platform,
      }),
      { mode: 0o755 },
    );

    return script;
  }
}
