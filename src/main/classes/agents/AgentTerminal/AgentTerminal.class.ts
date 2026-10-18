import type { IAgentTerminal, ITerminalScreen, ITerminalView } from './types';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { access, chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { AGENT_TERMINAL, LINK_CATCHER, RELAY_SCRIPT } from './constants';
import { blankScreen, paintScreen } from './library';

/** An agent CLI's full-screen interface, run in a terminal nobody sees: QAzinho reads its screen and presses its keys. */
export class AgentTerminal {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly linksFile: string;
  private screen: ITerminalScreen = blankScreen({
    height: AGENT_TERMINAL.height,
    width: AGENT_TERMINAL.width,
  });
  private drawnAt = 0;
  private hasExited = false;

  private constructor(props: {
    child: ChildProcessWithoutNullStreams;
    linksFile: string;
  }) {
    this.child = props.child;
    this.linksFile = props.linksFile;
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (output: string) => {
      this.screen = paintScreen({ screen: this.screen, output });
      this.drawnAt = Date.now();
    });
    this.child.stderr.resume();
    this.child.stdin.on('error', () => undefined);
    this.child.on('error', () => {
      this.hasExited = true;
    });
    this.child.on('close', () => {
      this.hasExited = true;
    });
  }

  /** Whether this machine has the `expect` the hidden terminal runs on; every Mac does. */
  public static async isAvailable(): Promise<boolean> {
    return access(AGENT_TERMINAL.expect, constants.X_OK).then(
      () => true,
      () => false,
    );
  }

  /** Starts the agent in a hidden terminal. A page it asks the browser to open is caught, not opened. */
  public static async open(props: IAgentTerminal): Promise<AgentTerminal> {
    const relay = join(tmpdir(), AGENT_TERMINAL.relayFile);
    const catcher = join(tmpdir(), AGENT_TERMINAL.catcherFile);
    const linksFile = join(tmpdir(), `${AGENT_TERMINAL.linksPrefix}${randomUUID()}`);

    await writeFile(relay, RELAY_SCRIPT);
    await writeFile(catcher, LINK_CATCHER);
    await chmod(catcher, 0o755);
    await mkdir(props.cwd, { recursive: true });

    const child = spawn(
      AGENT_TERMINAL.expect,
      ['-f', relay, props.command, ...props.args],
      {
        cwd: props.cwd,
        env: {
          ...props.env,
          TERM: 'xterm-256color',
          BROWSER: catcher,
          QAZINHO_LINKS: linksFile,
        },
      },
    );

    return new AgentTerminal({ child, linksFile });
  }

  /** What the agent shows now, the pages it asked a browser to open, and whether it has closed. */
  public async view(): Promise<ITerminalView> {
    const links = await readFile(this.linksFile, 'utf8').catch(() => '');

    return {
      rows: this.screen.cells.map((cells) => cells.join('').trimEnd()),
      links: links.split('\n').filter((link) => link !== ''),
      hasExited: this.hasExited,
    };
  }

  /** Types keys into the agent, then waits for its screen to answer them and settle. */
  public async press(keys: string): Promise<void> {
    if (this.hasExited) return;

    const pressedAt = Date.now();

    this.child.stdin.write(keys);

    while (!this.hasExited && Date.now() - pressedAt < AGENT_TERMINAL.keyMs) {
      await sleep(AGENT_TERMINAL.lookMs);

      if (
        this.drawnAt > pressedAt &&
        Date.now() - this.drawnAt >= AGENT_TERMINAL.settleMs
      )
        return;
    }
  }

  /** Reads the screen whenever it settles until `read` answers; null once the agent closes, `ms` runs out or `signal` aborts. */
  public async waitFor<T>(props: {
    read: (view: ITerminalView) => T | null;
    ms: number;
    signal: AbortSignal;
  }): Promise<T | null> {
    const deadline = Date.now() + props.ms;
    let lookedAt = 0;

    while (!props.signal.aborted && Date.now() < deadline) {
      await sleep(AGENT_TERMINAL.lookMs);

      const now = Date.now();
      const isDrawing = now - this.drawnAt < AGENT_TERMINAL.settleMs;

      if (isDrawing && now - lookedAt < AGENT_TERMINAL.staleMs) continue;

      lookedAt = now;

      const view = await this.view();
      const answer = props.read(view);

      if (answer !== null) return answer;
      if (view.hasExited) return null;
    }

    return null;
  }

  /** Ends the agent and the terminal around it. */
  public close(): void {
    this.child.kill();
    void rm(this.linksFile, { force: true });
  }
}
