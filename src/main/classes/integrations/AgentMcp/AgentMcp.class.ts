import type { IAgentMcp, IListedMcpServer, IMcpRecipe } from './types';
import type {
  IMcpServerStatus,
  IMcpServerTarget,
  McpActionResult,
  McpServerId,
  McpServerState,
  McpSignInResult,
} from '@/shared/types';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AGENT_MCP, MCP_CATALOG, MCP_RECIPES } from './constants';
import {
  authorizeUrlIn,
  parseCodexMcpList,
  parseMcpList,
  runCommand,
  signInScript,
} from './library';

/** The MCP servers QAzinho sets up in the QA's own agent: added there, signed in there, read back from there. */
export class AgentMcp {
  private readonly findAgent: (agentId: string) => Promise<string | null>;
  private readonly openUrl: (url: string) => Promise<void>;
  private readonly openScript: (file: string) => Promise<void>;
  private readonly folder: string;

  public constructor(props: IAgentMcp) {
    this.findAgent = props.findAgent;
    this.openUrl = props.openUrl;
    this.openScript = props.openScript;
    this.folder = props.folder;
  }

  /** Where each server QAzinho knows stands in the agent, matched by address, whatever the QA named it. */
  public async list(agentId: string): Promise<IMcpServerStatus[]> {
    const ids = Object.keys(MCP_CATALOG) as McpServerId[];
    const recipe = MCP_RECIPES[agentId];
    const command = await this.findAgent(agentId);

    if (!recipe || command === null)
      return ids.map((id) => ({ id, state: recipe ? 'no-agent' : 'unsupported' }));

    const listed = await this.listed({ recipe, command });

    return ids.map((id) => ({ id, state: this.stateIn({ listed, id }) }));
  }

  /** Adds the server when it is missing and starts the sign-in, in Terminal or in the browser, as the agent does it. */
  public async connect(target: IMcpServerTarget): Promise<McpSignInResult> {
    const recipe = MCP_RECIPES[target.agentId];
    const command = await this.findAgent(target.agentId);

    if (!recipe || command === null)
      return { ok: false, error: 'QAzinho cannot set up MCP servers in this agent yet.' };

    const server = MCP_CATALOG[target.id];
    const state = this.stateIn({
      listed: await this.listed({ recipe, command }),
      id: target.id,
    });

    if (recipe.signIn === 'browser')
      return this.signInInBrowser({
        command,
        args: state === 'missing' ? recipe.add(server) : recipe.login(server.name),
      });

    if (state === 'missing') {
      const added = await this.attempt({
        command,
        args: recipe.add(server),
        isDone: (said) => /already exists/i.test(said),
      });

      if (!added.ok) return added;
    }

    return this.signInInTerminal({
      command,
      args: recipe.login(server.name),
      server: server.name,
    });
  }

  /** Takes the server back out of the agent; one already gone counts as removed. */
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

  private async signInInTerminal(props: {
    command: string;
    args: string[];
    server: string;
  }): Promise<McpSignInResult> {
    if (process.platform !== 'darwin')
      return {
        ok: false,
        error: `Open a terminal, run ${[props.command, ...props.args].join(' ')}, pick ${props.server} and choose Authenticate.`,
      };

    const script = join(tmpdir(), AGENT_MCP.signInFile);

    await mkdir(this.folder, { recursive: true });
    await writeFile(script, signInScript({ ...props, folder: this.folder }), {
      mode: 0o755,
    });
    await this.openScript(script);

    return { ok: true, via: 'terminal' };
  }

  private async signInInBrowser(props: {
    command: string;
    args: string[];
  }): Promise<McpSignInResult> {
    await mkdir(this.folder, { recursive: true });

    const child = spawn(props.command, props.args, { cwd: this.folder });
    const giveUp = setTimeout(() => child.kill(), AGENT_MCP.browserSignInMs);
    let printed = '';

    child.on('close', () => {
      clearTimeout(giveUp);
    });

    return new Promise<McpSignInResult>((done) => {
      const noUrl = setTimeout(() => {
        child.kill();
        done({
          ok: false,
          error: printed.trim() || 'The agent never asked for a sign-in.',
        });
      }, AGENT_MCP.urlWaitMs);

      const hear = (chunk: Buffer) => {
        printed += chunk.toString();

        const url = authorizeUrlIn(printed);

        if (url === null) return;

        clearTimeout(noUrl);
        void this.openUrl(url).then(() => {
          done({ ok: true, via: 'browser' });
        });
      };

      child.stdout.on('data', hear);
      child.stderr.on('data', hear);
      child.on('close', (code) => {
        clearTimeout(noUrl);
        done(
          code === 0
            ? { ok: true, via: 'browser' }
            : { ok: false, error: printed.trim() },
        );
      });
    });
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
