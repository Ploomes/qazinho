import type { GhAnswer, IGithubCli } from './types';
import type {
  GithubSignInPhase,
  GithubSignInProgress,
  GithubSignInStep,
  IGithubStatus,
} from '@/shared/types';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { findOnPath, stripAnsi } from '@/main/library';
import { GITHUB_CLI } from './constants';
import {
  apiArgsOf,
  deviceCodeIn,
  includedOf,
  loginIn,
  missingScopesOf,
  refusalOf,
} from './library';

/** Talks to GitHub as the QA through their own GitHub CLI: the login stays with gh, and QAzinho keeps no token. */
export class GithubCli {
  private readonly directories: () => Promise<string[]>;
  private readonly onProgress: (progress: GithubSignInProgress) => void;
  private signingIn: AbortController | null = null;

  public constructor(props: IGithubCli) {
    this.directories = props.directories;
    this.onProgress = props.onProgress;
  }

  /** Where the GitHub CLI is on this machine, or null when it is not here. */
  public async find(): Promise<string | null> {
    return findOnPath({ command: 'gh', directories: await this.directories() });
  }

  /** Whether gh is here, whom it is signed in as, and the access QAzinho needs that its login lacks. */
  public async status(): Promise<IGithubStatus> {
    const path = await this.find();
    const cli = { isFound: path !== null, path };

    if (path === null)
      return { cli, account: null, missingScopes: [], failure: 'no-cli' };

    const answer = await this.call({
      path,
      args: ['api', '--include', 'user'],
      timeoutMs: GITHUB_CLI.apiTimeoutMs,
    });

    if (!answer.isOk)
      return { cli, account: null, missingScopes: [], failure: answer.failure };

    const included = includedOf(answer.text);
    const account = loginIn(included.body);

    return account === null
      ? { cli, account, missingScopes: [], failure: 'unexpected' }
      : {
          cli,
          account,
          missingScopes: missingScopesOf(included.headers['x-oauth-scopes']),
          failure: null,
        };
  }

  /** Signs the QA in through gh's own device flow, or asks GitHub again for the access QAzinho lacks; resolves when it ends. */
  public async signIn(): Promise<GithubSignInProgress> {
    this.cancelSignIn();

    const controller = new AbortController();

    this.signingIn = controller;

    try {
      return await this.runSignIn(controller.signal);
    } finally {
      if (this.signingIn === controller) this.signingIn = null;
    }
  }

  /** Stops a sign-in under way: gh closes, and the sign-in ends cancelled. */
  public cancelSignIn(): void {
    this.signingIn?.abort();
  }

  /** One request to GitHub's REST API as the QA: what GitHub answered, or why it or gh refused. */
  public async api(props: {
    path: string;
    accept?: string;
    paginate?: boolean;
    jq?: string;
  }): Promise<GhAnswer> {
    const path = await this.find();

    if (path === null)
      return { isOk: false, failure: 'no-cli', httpStatus: null, said: '' };

    return this.call({
      path,
      args: apiArgsOf(props),
      timeoutMs: GITHUB_CLI.apiTimeoutMs,
    });
  }

  /** Downloads an archive GitHub serves, such as a commit's tarball, and unpacks it into a folder without its top folder. */
  public async extract(props: {
    path: string;
    dir: string;
    onBytes?: (bytes: number) => void;
  }): Promise<GhAnswer> {
    const gh = await this.find();

    if (gh === null)
      return { isOk: false, failure: 'no-cli', httpStatus: null, said: '' };

    const tar = findOnPath({ command: 'tar', directories: await this.directories() });

    await mkdir(props.dir, { recursive: true });

    return new Promise<GhAnswer>((done) => {
      const fetching = spawn(gh, apiArgsOf({ path: props.path }), {
        env: { ...process.env, ...GITHUB_CLI.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const unpacking = spawn(
        tar ?? 'tar',
        ['-xzf', '-', '-C', props.dir, '--strip-components', '1'],
        { stdio: ['pipe', 'ignore', 'pipe'] },
      );
      const ended = { fetching: null as number | null, unpacking: null as number | null };
      let fetchSaid = '';
      let tarSaid = '';
      let bytes = 0;
      let isDone = false;
      const finish = (answer: GhAnswer) => {
        if (isDone) return;

        isDone = true;
        clearTimeout(timer);
        done(answer);
      };
      const settle = () => {
        if (ended.fetching === null || ended.unpacking === null) return;

        if (ended.fetching !== 0)
          finish({
            isOk: false,
            ...refusalOf({ code: ended.fetching, said: stripAnsi(fetchSaid).trim() }),
          });
        else if (ended.unpacking !== 0)
          finish({
            isOk: false,
            failure: 'unexpected',
            httpStatus: null,
            said: tarSaid.trim(),
          });
        else finish({ isOk: true, text: '' });
      };
      const timer = setTimeout(() => {
        fetching.kill();
        unpacking.kill();
        finish({
          isOk: false,
          failure: 'unreachable',
          httpStatus: null,
          said: 'The download took too long.',
        });
      }, GITHUB_CLI.downloadTimeoutMs);

      unpacking.stdin.on('error', () => undefined);
      fetching.stdout.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        props.onBytes?.(bytes);
      });
      fetching.stdout.pipe(unpacking.stdin);
      fetching.stderr.on('data', (chunk: Buffer) => {
        fetchSaid += chunk.toString();
      });
      unpacking.stderr.on('data', (chunk: Buffer) => {
        tarSaid += chunk.toString();
      });
      fetching.on('error', (error) => {
        unpacking.kill();
        finish({ isOk: false, ...refusalOf({ code: null, said: error.message }) });
      });
      unpacking.on('error', (error) => {
        fetching.kill();
        finish({
          isOk: false,
          failure: 'unexpected',
          httpStatus: null,
          said: error.message,
        });
      });
      fetching.on('close', (code) => {
        ended.fetching = code ?? 1;
        settle();
      });
      unpacking.on('close', (code) => {
        ended.unpacking = code ?? 1;
        settle();
      });
    });
  }

  private async runSignIn(signal: AbortSignal): Promise<GithubSignInProgress> {
    const steps: GithubSignInStep[] = ['code', 'browser', 'account'];
    const report = (phase: GithubSignInPhase): GithubSignInProgress => {
      const progress = { steps, ...phase };

      this.onProgress(progress);

      return progress;
    };

    report({ phase: 'working', at: 'code', code: null, url: null });

    const status = await this.status();

    if (signal.aborted) return report({ phase: 'cancelled' });

    if (status.cli.path === null)
      return report({ phase: 'failed', at: 'code', failure: 'missing', said: '' });

    if (status.account !== null && status.missingScopes.length === 0)
      return report({ phase: 'connected', account: status.account });

    const args =
      status.account === null
        ? [
            'auth',
            'login',
            '--hostname',
            GITHUB_CLI.host,
            '--git-protocol',
            'https',
            '--web',
          ]
        : [
            'auth',
            'refresh',
            '--hostname',
            GITHUB_CLI.host,
            '--scopes',
            GITHUB_CLI.scopes.join(','),
          ];
    const stopped = await this.follow({ path: status.cli.path, args, signal, report });

    if (stopped !== null) return stopped;

    report({ phase: 'working', at: 'account', code: null, url: null });

    const after = await this.status();

    return after.account === null
      ? report({ phase: 'failed', at: 'account', failure: 'refused', said: '' })
      : report({ phase: 'connected', account: after.account });
  }

  private follow(props: {
    path: string;
    args: string[];
    signal: AbortSignal;
    report: (phase: GithubSignInPhase) => GithubSignInProgress;
  }): Promise<GithubSignInProgress | null> {
    const { signal, report } = props;

    if (signal.aborted) return Promise.resolve(report({ phase: 'cancelled' }));

    const child: ChildProcess = spawn(props.path, props.args, {
      env: {
        ...process.env,
        ...GITHUB_CLI.env,
        ...(process.platform === 'win32' ? {} : { GH_BROWSER: 'true' }),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return new Promise<GithubSignInProgress | null>((done) => {
      let printed = '';
      let shown: { code: string; url: string } | null = null;
      let isDone = false;
      const at = (): GithubSignInStep => (shown === null ? 'code' : 'browser');
      const finish = (ended: GithubSignInProgress | null) => {
        if (isDone) return;

        isDone = true;
        clearTimeout(giveUp);
        signal.removeEventListener('abort', stop);
        child.kill();
        done(ended);
      };
      const stop = () => {
        finish(report({ phase: 'cancelled' }));
      };
      const hear = (chunk: Buffer) => {
        printed += chunk.toString();

        const found = deviceCodeIn(stripAnsi(printed));

        if (found === null || shown !== null) return;

        shown = found;
        report({ phase: 'working', at: 'browser', code: found.code, url: found.url });
      };
      const giveUp = setTimeout(() => {
        finish(report({ phase: 'failed', at: at(), failure: 'timeout', said: '' }));
      }, GITHUB_CLI.signInMs);

      signal.addEventListener('abort', stop, { once: true });
      child.stdin?.on('error', () => undefined);
      child.stdin?.end();
      child.stdout?.on('data', hear);
      child.stderr?.on('data', hear);
      child.on('error', (error) => {
        finish(
          report({ phase: 'failed', at: at(), failure: 'closed', said: error.message }),
        );
      });
      child.on('close', (code) => {
        finish(
          code === 0
            ? null
            : report({
                phase: 'failed',
                at: at(),
                failure: 'refused',
                said: stripAnsi(printed).trim().slice(-GITHUB_CLI.saidChars),
              }),
        );
      });
    });
  }

  private call(props: {
    path: string;
    args: string[];
    timeoutMs: number;
  }): Promise<GhAnswer> {
    return new Promise<GhAnswer>((done) => {
      const child = spawn(props.path, props.args, {
        env: { ...process.env, ...GITHUB_CLI.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const out: Buffer[] = [];
      let said = '';
      let isDone = false;
      const finish = (answer: GhAnswer) => {
        if (isDone) return;

        isDone = true;
        clearTimeout(timer);
        done(answer);
      };
      const timer = setTimeout(() => {
        child.kill();
        finish({
          isOk: false,
          failure: 'unreachable',
          httpStatus: null,
          said: 'GitHub took too long to answer.',
        });
      }, props.timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        out.push(chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        said += chunk.toString();
      });
      child.on('error', (error) => {
        finish({ isOk: false, ...refusalOf({ code: null, said: error.message }) });
      });
      child.on('close', (code) => {
        finish(
          code === 0
            ? { isOk: true, text: Buffer.concat(out).toString() }
            : { isOk: false, ...refusalOf({ code, said: stripAnsi(said).trim() }) },
        );
      });
    });
  }
}
