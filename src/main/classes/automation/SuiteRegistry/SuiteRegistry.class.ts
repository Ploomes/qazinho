import type { ISuiteRegistry } from './types';
import type { GitCli } from '@/main/classes/automation/GitCli';
import type { ISuite, SuitePick } from '@/shared/types';
import { mkdir, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { SUITE_REGISTRY } from './constants';
import {
  configFileIn,
  envKeysOf,
  repositoryOfRemote,
  runnerPathsOf,
  versionIn,
} from './library';

/** The suites connected to the QA's projects: main keeps the folder of each, and reads what it holds afresh each time it is asked. */
export class SuiteRegistry {
  private readonly root: string;
  private readonly git: Pick<GitCli, 'run'>;

  public constructor(props: ISuiteRegistry) {
    this.root = props.root;
    this.git = props.git;
  }

  /** Connects a folder to a project once it holds a Playwright suite, in place of any suite the project had; a link is kept as the folder it leads to, where Playwright reads the files. */
  public async connect(props: { projectId: string; path: string }): Promise<SuitePick> {
    const path = await realpath(props.path).catch(() => props.path);
    const suite = await this.inspect({ projectId: props.projectId, path });

    if (suite === null) return { kind: 'failed', reason: 'no-playwright' };

    await this.write({ ...(await this.read()), [props.projectId]: path });

    return { kind: 'picked', suite };
  }

  /** The suite a project is connected to, read again from its folder; null for none, or one whose folder no longer holds it. */
  public async suiteOf(projectId: string): Promise<ISuite | null> {
    const path = (await this.read())[projectId];

    return path === undefined ? null : this.inspect({ projectId, path });
  }

  /** The folder of the suite a project is connected to, as main keeps it; null for none. */
  public async pathOf(projectId: string): Promise<string | null> {
    return (await this.read())[projectId] ?? null;
  }

  /** Where the Playwright Test a suite runs on is installed, in its folder or one above it, with its version; null until its packages are installed. */
  public async runnerOf(path: string): Promise<{ cli: string; version: string } | null> {
    for (const file of runnerPathsOf(path)) {
      const version = versionIn(await readFile(file, 'utf8').catch(() => ''));

      if (version !== null)
        return { cli: join(dirname(file), SUITE_REGISTRY.cli), version };
    }

    return null;
  }

  /** Forgets the suite of a project; its folder stays as the QA left it. */
  public async forget(projectId: string): Promise<void> {
    const kept = Object.entries(await this.read()).filter(([id]) => id !== projectId);

    await this.write(Object.fromEntries(kept));
  }

  private async inspect(props: {
    projectId: string;
    path: string;
  }): Promise<ISuite | null> {
    const { projectId, path } = props;
    const names = await readdir(path).catch(() => null);
    const config = names === null ? null : configFileIn(names);

    if (config === null) return null;

    const read = (parts: readonly string[]) =>
      readFile(join(path, ...parts), 'utf8').catch(() => '');
    const [runner, branch, remote, example, env] = await Promise.all([
      this.runnerOf(path),
      this.git.run({ cwd: path, args: ['rev-parse', '--abbrev-ref', 'HEAD'] }),
      this.git.run({ cwd: path, args: ['remote', 'get-url', 'origin'] }),
      read([SUITE_REGISTRY.envExample]),
      read([SUITE_REGISTRY.envFile]),
    ]);

    return {
      projectId,
      path,
      name: basename(path),
      config,
      version: runner?.version ?? null,
      branch: branch.isOk && branch.text.trim() !== '' ? branch.text.trim() : null,
      repository: remote.isOk ? repositoryOfRemote(remote.text) : null,
      envKeys: envKeysOf(example),
      envFileKeys: envKeysOf(env),
    };
  }

  private async read(): Promise<Record<string, string>> {
    const text = await readFile(join(this.root, SUITE_REGISTRY.file), 'utf8').catch(
      () => '{}',
    );

    try {
      const read: unknown = JSON.parse(text);

      return typeof read === 'object' && read !== null
        ? Object.fromEntries(
            Object.entries(read).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string',
            ),
          )
        : {};
    } catch {
      return {};
    }
  }

  private async write(paths: Record<string, string>): Promise<void> {
    await mkdir(this.root, { recursive: true });
    await writeFile(join(this.root, SUITE_REGISTRY.file), JSON.stringify(paths, null, 2));
  }
}
