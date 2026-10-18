import type { IAgentMcp } from './types';
import type { IMcpServerStatus, McpActionResult, McpServerId } from '@/shared/types';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AGENT_MCP, MCP_CATALOG } from './constants';
import { parseMcpList, runCommand, signInScript } from './library';

/** The MCP servers QAzinho sets up in the QA's own Claude Code: added there, signed in there, read from there. */
export class AgentMcp {
  private readonly findClaude: () => Promise<string | null>;
  private readonly folder: string;

  public constructor(props: IAgentMcp) {
    this.findClaude = props.findClaude;
    this.folder = props.folder;
  }

  /** Where each server QAzinho knows stands in Claude Code, matched by address, whatever the QA named it. */
  public async list(): Promise<IMcpServerStatus[]> {
    const ids = Object.keys(MCP_CATALOG) as McpServerId[];
    const claude = await this.findClaude();

    if (claude === null) return ids.map((id) => ({ id, state: 'no-agent' }));

    const listed = parseMcpList(
      await this.claude({ claude, args: ['mcp', 'list'] }).catch(() => ''),
    );

    return ids.map((id) => ({
      id,
      state:
        listed.find(({ target }) => target === MCP_CATALOG[id].url)?.state ?? 'missing',
    }));
  }

  /** Adds the server to Claude Code for every project of the QA's; one already there counts as added. */
  public async add(id: McpServerId): Promise<McpActionResult> {
    const { name, url } = MCP_CATALOG[id];

    return this.attempt({
      args: ['mcp', 'add', '--transport', 'http', '--scope', 'user', name, url],
      isDone: (said) => /already exists/i.test(said),
    });
  }

  /** Takes the server back out of Claude Code; one already gone counts as removed. */
  public async remove(id: McpServerId): Promise<McpActionResult> {
    return this.attempt({
      args: ['mcp', 'remove', '--scope', 'user', MCP_CATALOG[id].name],
      isDone: (said) => /no .*server .*found|not found/i.test(said),
    });
  }

  /** Opens Terminal on Claude Code's MCP list, where the QA signs in; the sign-in itself never passes through QAzinho. */
  public async signIn(id: McpServerId): Promise<McpActionResult> {
    const claude = await this.findClaude();

    if (claude === null)
      return { ok: false, error: 'Claude Code is not on this machine.' };

    if (process.platform !== 'darwin')
      return {
        ok: false,
        error: `Open a terminal, run claude "/mcp", pick ${MCP_CATALOG[id].name} and choose Authenticate.`,
      };

    const script = join(tmpdir(), AGENT_MCP.signInFile);

    await mkdir(this.folder, { recursive: true });
    await writeFile(
      script,
      signInScript({ claude, folder: this.folder, server: MCP_CATALOG[id].name }),
      { mode: 0o755 },
    );
    await runCommand({ command: 'open', args: ['-a', 'Terminal', script] });

    return { ok: true };
  }

  private async attempt(props: {
    args: string[];
    isDone: (said: string) => boolean;
  }): Promise<McpActionResult> {
    const claude = await this.findClaude();

    if (claude === null)
      return { ok: false, error: 'Claude Code is not on this machine.' };

    try {
      await this.claude({ claude, args: props.args });

      return { ok: true };
    } catch (reason) {
      const said = reason instanceof Error ? reason.message : String(reason);

      return props.isDone(said) ? { ok: true } : { ok: false, error: said };
    }
  }

  private async claude(props: { claude: string; args: string[] }): Promise<string> {
    await mkdir(this.folder, { recursive: true });

    return runCommand({ command: props.claude, args: props.args, cwd: this.folder });
  }
}
