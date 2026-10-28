import type {
  IAgentMcp,
  IListedMcpServer,
  IMcpRecipe,
  IMcpSignInRun,
  McpSignInRoute,
} from './types';
import type {
  IMcpServerStatus,
  IMcpServerTarget,
  IMcpSignIn,
  McpActionResult,
  McpServerId,
  McpServerState,
  McpSignInPhase,
  McpSignInProgress,
  McpSignInStep,
} from '@/shared/types';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { AgentTerminal } from '@/main/classes/agents/AgentTerminal';
import { authorizeUrlIn, spawnCommand } from '@/main/library';
import { AGENT_MCP, MCP_CATALOG, MCP_RECIPES, MCP_ROUTE_STEPS } from './constants';
import {
  nextMcpMove,
  parseCodexMcpList,
  parseMcpList,
  runCommand,
  signInScript,
} from './library';

/**
 * Os servidores MCP que o QAzinho configura no próprio agente do QA: adicionados lá, com
 * login lá, lidos de volta de lá.
 */
export class AgentMcp {
  private readonly findAgent: (agentId: string) => Promise<string | null>;
  private readonly openUrl: (url: string) => Promise<void>;
  private readonly openScript: (file: string) => Promise<boolean>;
  private readonly onProgress: (progress: McpSignInProgress) => void;
  private readonly folder: string;
  private readonly signIns = new Map<string, AbortController>();

  public constructor(props: IAgentMcp) {
    this.findAgent = props.findAgent;
    this.openUrl = props.openUrl;
    this.openScript = props.openScript;
    this.onProgress = props.onProgress;
    this.folder = props.folder;
  }

  /**
   * Em que pé está no agente cada servidor que o QAzinho conhece, casado pelo endereço,
   * seja qual for o nome que o QA lhe deu.
   */
  public async list(agentId: string): Promise<IMcpServerStatus[]> {
    const ids = Object.keys(MCP_CATALOG) as McpServerId[];
    const recipe = MCP_RECIPES[agentId];
    const command = await this.findAgent(agentId);

    if (!recipe || command === null)
      return ids.map((id) => ({ id, state: recipe ? 'no-agent' : 'unsupported' }));

    const listed = await this.listed({ recipe, command });

    return ids.map((id) => ({ id, state: this.stateIn({ listed, id }) }));
  }

  /**
   * Adiciona o servidor quando falta e faz o QA entrar pelo agente, relatando cada passo;
   * resolve com como terminou.
   */
  public async connect(signIn: IMcpSignIn): Promise<McpSignInProgress> {
    const key = `${signIn.target.agentId}:${signIn.target.id}`;
    const controller = new AbortController();

    this.signIns.get(key)?.abort();
    this.signIns.set(key, controller);

    try {
      return await this.signIn({ ...signIn, signal: controller.signal });
    } finally {
      if (this.signIns.get(key) === controller) this.signIns.delete(key);
    }
  }

  /**
   * Para um login em andamento: o agente que o QAzinho dirige para ele fecha, e o login
   * termina cancelado.
   */
  public cancel(target: IMcpServerTarget): void {
    this.signIns.get(`${target.agentId}:${target.id}`)?.abort();
  }

  /** Para todo login em andamento, para quando o QAzinho fecha. */
  public close(): void {
    for (const controller of this.signIns.values()) controller.abort();
  }

  /** Tira o servidor de volta do agente; um que já se foi conta como removido. */
  public async remove(target: IMcpServerTarget): Promise<McpActionResult> {
    const recipe = MCP_RECIPES[target.agentId];
    const command = await this.findAgent(target.agentId);

    if (!recipe || command === null)
      return { ok: false, error: 'QAzinho cannot set up MCP servers in this agent yet.' };

    return this.attempt({
      command,
      args: recipe.remove(MCP_CATALOG[target.id].name),
      isDone: (said) => /no mcp server named|not found/i.test(said),
    });
  }

  private async signIn(
    props: IMcpSignIn & { signal: AbortSignal },
  ): Promise<McpSignInProgress> {
    const { target, signal } = props;
    let steps: McpSignInStep[] = ['check'];
    const report = (phase: McpSignInPhase): McpSignInProgress => {
      const progress = { target, steps, ...phase };

      this.onProgress(progress);

      return progress;
    };

    report({ phase: 'working', at: 'check', url: null, opensAt: null });

    const recipe = MCP_RECIPES[target.agentId];
    const command = await this.findAgent(target.agentId);

    if (!recipe || command === null)
      return report({
        phase: 'failed',
        at: 'check',
        failure: 'unsupported',
        said: '',
        canUseTerminal: false,
      });

    const server = MCP_CATALOG[target.id];
    const listed =
      (await this.listed({ recipe, command })).find(
        ({ target: url }) => url === server.url,
      ) ?? null;

    if (signal.aborted) return report({ phase: 'cancelled' });
    if (listed?.state === 'connected') return report({ phase: 'connected' });

    const route: McpSignInRoute =
      props.inTerminal ||
      (recipe.signIn === 'hidden' && !(await AgentTerminal.isAvailable()))
        ? 'terminal'
        : recipe.signIn;
    const first: McpSignInStep =
      listed === null ? 'add' : (MCP_ROUTE_STEPS[route][0] ?? 'check');
    const run: IMcpSignInRun = {
      target,
      recipe,
      command,
      name: listed?.name ?? server.name,
      signal,
      report,
    };

    steps = [
      'check',
      ...(listed === null ? (['add'] as const) : []),
      ...MCP_ROUTE_STEPS[route],
    ];

    if (route === 'browser')
      return this.signInInBrowser({
        ...run,
        first,
        args: listed === null ? recipe.add(server) : recipe.login(run.name),
      });

    if (listed === null) {
      report({ phase: 'working', at: 'add', url: null, opensAt: null });

      const added = await this.attempt({
        command,
        args: recipe.add(server),
        isDone: (said) => /already exists/i.test(said),
      });

      if (!added.ok)
        return report({
          phase: 'failed',
          at: 'add',
          failure: 'add',
          said: added.error,
          canUseTerminal: false,
        });
    }

    if (signal.aborted) return report({ phase: 'cancelled' });

    return route === 'hidden' ? this.signInHidden(run) : this.signInInTerminal(run);
  }

  private async signInHidden(run: IMcpSignInRun): Promise<McpSignInProgress> {
    run.report({ phase: 'working', at: 'open', url: null, opensAt: null });

    const terminal = await AgentTerminal.open({
      command: run.command,
      args: run.recipe.login(run.name),
      cwd: this.folder,
      env: process.env,
    });
    const server = { name: run.name, url: MCP_CATALOG[run.target.id].url };
    let at = 'open' as McpSignInStep;
    let url: string | null = null;
    let presses = 0;
    let deadline = Date.now() + AGENT_MCP.screenWaitMs;
    const fail = (props: {
      failure: 'screen' | 'refused' | 'timeout' | 'closed';
      said: string;
    }) =>
      run.report({
        phase: 'failed',
        at,
        ...props,
        canUseTerminal: props.failure === 'screen' || props.failure === 'closed',
      });
    const reach = (step: McpSignInStep, opensAt: number | null = null) => {
      at = step;
      deadline =
        Date.now() +
        (step === 'browser' ? AGENT_MCP.browserSignInMs : AGENT_MCP.stepWaitMs);
      run.report({ phase: 'working', at, url, opensAt });
    };

    try {
      while (!run.signal.aborted) {
        const seen = await terminal.waitFor({
          read: ({ rows, links }) => {
            const move = nextMcpMove({ rows, server });
            const link = links.at(-1) ?? null;
            const isWaiting =
              move.kind === 'wait' ||
              (at === 'browser' &&
                (move.kind === 'authorizing' || move.kind === 'press'));

            return link !== url || !isWaiting ? { move, link } : null;
          },
          ms: Math.max(0, Math.min(AGENT_MCP.pollMs, deadline - Date.now())),
          signal: run.signal,
        });

        if (run.signal.aborted) break;

        if (seen === null) {
          if ((await terminal.view()).hasExited)
            return fail({ failure: 'closed', said: '' });
          if (at === 'browser' && (await this.isConnected(run)))
            return run.report({ phase: 'connected' });
          if (Date.now() >= deadline)
            return fail({ failure: at === 'browser' ? 'timeout' : 'screen', said: '' });

          continue;
        }

        if (seen.link !== null && seen.link !== url) {
          url = seen.link;
          reach('browser', Date.now() + AGENT_MCP.headsUpMs);
          await sleep(AGENT_MCP.headsUpMs, undefined, { signal: run.signal }).catch(
            () => undefined,
          );

          if (run.signal.aborted) break;

          await this.openUrl(url);
          reach('browser');
        }

        const { move } = seen;

        if (move.kind === 'connected') return run.report({ phase: 'connected' });
        if (move.kind === 'refused') return fail({ failure: 'refused', said: move.said });
        if (move.kind === 'authorizing' && at !== 'browser') reach('browser');
        if (move.kind !== 'press' || at === 'browser') continue;

        presses += 1;

        if (presses > AGENT_MCP.maxPresses) return fail({ failure: 'screen', said: '' });
        if (move.step === 'authorize' && at === 'open') reach('authorize');

        await terminal.press(move.keys);
      }

      return run.report({ phase: 'cancelled' });
    } finally {
      terminal.close();
    }
  }

  private async signInInBrowser(
    run: IMcpSignInRun & { args: string[]; first: McpSignInStep },
  ): Promise<McpSignInProgress> {
    run.report({
      phase: 'working',
      at: run.first,
      url: null,
      opensAt: Date.now() + AGENT_MCP.headsUpMs,
    });
    await sleep(AGENT_MCP.headsUpMs, undefined, { signal: run.signal }).catch(
      () => undefined,
    );

    if (run.signal.aborted) return run.report({ phase: 'cancelled' });

    run.report({ phase: 'working', at: run.first, url: null, opensAt: null });
    await mkdir(this.folder, { recursive: true });

    const child = spawnCommand({
      command: run.command,
      args: run.args,
      options: { cwd: this.folder },
    });
    let printed = '';
    let url: string | null = null;

    return new Promise<McpSignInProgress>((done) => {
      let isDone = false;
      const finish = (phase: McpSignInPhase) => {
        if (isDone) return;

        isDone = true;
        clearTimeout(noUrl);
        clearTimeout(giveUp);
        run.signal.removeEventListener('abort', stop);
        child.kill();
        done(run.report(phase));
      };
      const stop = () => {
        finish({ phase: 'cancelled' });
      };
      const noUrl = setTimeout(() => {
        finish({
          phase: 'failed',
          at: run.first,
          failure: 'screen',
          said: printed.trim(),
          canUseTerminal: false,
        });
      }, AGENT_MCP.urlWaitMs);
      const giveUp = setTimeout(() => {
        finish({
          phase: 'failed',
          at: 'browser',
          failure: 'timeout',
          said: '',
          canUseTerminal: false,
        });
      }, AGENT_MCP.browserSignInMs);
      const hear = (chunk: Buffer) => {
        printed += chunk.toString();

        const found = authorizeUrlIn(printed);

        if (found === null || url !== null) return;

        url = found;
        clearTimeout(noUrl);
        void this.openUrl(found);
        run.report({ phase: 'working', at: 'browser', url: found, opensAt: null });
      };

      run.signal.addEventListener('abort', stop, { once: true });
      child.stdout.on('data', hear);
      child.stderr.on('data', hear);
      child.on('error', (error) => {
        finish({
          phase: 'failed',
          at: run.first,
          failure: 'closed',
          said: error.message,
          canUseTerminal: false,
        });
      });
      child.on('close', (code) => {
        finish(
          code === 0
            ? { phase: 'connected' }
            : {
                phase: 'failed',
                at: url === null ? run.first : 'browser',
                failure: 'refused',
                said: printed.trim(),
                canUseTerminal: false,
              },
        );
      });
    });
  }

  private async signInInTerminal(run: IMcpSignInRun): Promise<McpSignInProgress> {
    const args = run.recipe.login(run.name);
    const { platform } = process;
    const extensions = AGENT_MCP.signInExtensions;
    const script = join(
      tmpdir(),
      `${AGENT_MCP.signInFile}${platform === 'darwin' ? extensions.darwin : platform === 'win32' ? extensions.win32 : extensions.other}`,
    );
    const deadline = Date.now() + AGENT_MCP.browserSignInMs;

    await mkdir(this.folder, { recursive: true });
    await writeFile(
      script,
      signInScript({
        command: run.command,
        args,
        folder: this.folder,
        server: run.name,
        platform,
      }),
      { mode: 0o755 },
    );

    if (!(await this.openScript(script)))
      return run.report({
        phase: 'failed',
        at: 'terminal',
        failure: 'manual',
        said: [run.command, ...args].map((part) => JSON.stringify(part)).join(' '),
        canUseTerminal: false,
      });

    run.report({ phase: 'working', at: 'terminal', url: null, opensAt: null });

    while (!run.signal.aborted && Date.now() < deadline) {
      await sleep(AGENT_MCP.pollMs);

      if (!run.signal.aborted && (await this.isConnected(run)))
        return run.report({ phase: 'connected' });
    }

    return run.signal.aborted
      ? run.report({ phase: 'cancelled' })
      : run.report({
          phase: 'failed',
          at: 'terminal',
          failure: 'timeout',
          said: '',
          canUseTerminal: false,
        });
  }

  private async isConnected(run: IMcpSignInRun): Promise<boolean> {
    const listed = await this.listed({ recipe: run.recipe, command: run.command });

    return this.stateIn({ listed, id: run.target.id }) === 'connected';
  }

  private async listed(props: {
    recipe: IMcpRecipe;
    command: string;
  }): Promise<IListedMcpServer[]> {
    const printed = await this.run({
      command: props.command,
      args: props.recipe.list,
    }).catch(() => '');

    return props.recipe.reads === 'codex'
      ? parseCodexMcpList(printed)
      : parseMcpList(printed);
  }

  private stateIn(props: {
    listed: IListedMcpServer[];
    id: McpServerId;
  }): McpServerState {
    return (
      props.listed.find(({ target }) => target === MCP_CATALOG[props.id].url)?.state ??
      'missing'
    );
  }

  private async attempt(props: {
    command: string;
    args: string[];
    isDone: (said: string) => boolean;
  }): Promise<McpActionResult> {
    try {
      await this.run(props);

      return { ok: true };
    } catch (reason) {
      const said = reason instanceof Error ? reason.message : String(reason);

      return props.isDone(said) ? { ok: true } : { ok: false, error: said };
    }
  }

  private async run(props: { command: string; args: string[] }): Promise<string> {
    await mkdir(this.folder, { recursive: true });

    return runCommand({ ...props, cwd: this.folder });
  }
}
