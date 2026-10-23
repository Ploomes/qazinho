import type { GitAnswer, IGitCli } from './types';
import { findOnPath, stripAnsi, spawnCommand } from '@/main/library';
import { GIT_CLI } from './constants';

/** Runs the QA's own git in a folder of theirs, never asking anything at a prompt; what it pushes goes with their own credentials. */
export class GitCli {
  private readonly directories: () => Promise<string[]>;
  private path: string | null = null;

  public constructor(props: IGitCli) {
    this.directories = props.directories;
  }

  /** One git command in a folder, with what it printed, or what it said when it refused or was not there. */
  public async run(props: {
    cwd: string;
    args: string[];
    timeoutMs?: number;
  }): Promise<GitAnswer> {
    const path =
      this.path ??
      (this.path = findOnPath({ command: 'git', directories: await this.directories() }));

    if (path === null) return { isOk: false, said: 'git is not on this machine.' };

    return new Promise<GitAnswer>((done) => {
      const child = spawnCommand({
        command: path,
        args: props.args,
        options: {
          cwd: props.cwd,
          env: { ...process.env, ...GIT_CLI.env },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      });
      const out: Buffer[] = [];
      let said = '';
      let isDone = false;
      const finish = (answer: GitAnswer) => {
        if (isDone) return;

        isDone = true;
        clearTimeout(timer);
        done(answer);
      };
      const timer = setTimeout(() => {
        child.kill();
        finish({ isOk: false, said: 'git took too long to answer.' });
      }, props.timeoutMs ?? GIT_CLI.timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        out.push(chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        said += chunk.toString();
      });
      child.on('error', (error) => {
        finish({ isOk: false, said: error.message });
      });
      child.on('close', (code) => {
        finish(
          code === 0
            ? { isOk: true, text: Buffer.concat(out).toString() }
            : { isOk: false, said: stripAnsi(said).trim().slice(0, GIT_CLI.saidChars) },
        );
      });
    });
  }
}
