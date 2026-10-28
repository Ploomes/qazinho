import type { ISuiteRegistry } from './types';
import type { GitCli } from '@/main/classes/automation/GitCli';
import type { ISuite, SuitePick } from '@/shared/types';
import { mkdir, readdir, readFile, realpath } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { writeAtomically } from '@/main/library';
import { SUITE_REGISTRY } from './constants';
import {
  configFileIn,
  envKeysOf,
  repositoryOfRemote,
  runnerPathsOf,
  versionIn,
} from './library';

/**
 * As suítes conectadas aos projetos do QA: a main guarda a pasta de cada uma, e lê o que
 * ela guarda de novo a cada vez que é perguntada.
 */
export class SuiteRegistry {
  private readonly root: string;
  private readonly git: Pick<GitCli, 'run'>;

  public constructor(props: ISuiteRegistry) {
    this.root = props.root;
    this.git = props.git;
  }

  /**
   * Conecta uma pasta com uma suíte de Playwright a um projeto, no lugar da suíte que ele
   * tinha.
   */
  public async connect(props: { projectId: string; path: string }): Promise<SuitePick> {
    const path = await realpath(props.path).catch(() => props.path);
    const suite = await this.inspect({ projectId: props.projectId, path });

    if (suite === null) return { kind: 'failed', reason: 'no-playwright' };

    await this.write({ ...(await this.read()), [props.projectId]: path });

    return { kind: 'picked', suite };
  }

  /**
   * A suíte a que um projeto está conectado, lida de novo da pasta dela; null para
   * nenhuma, ou uma cuja pasta não a guarda mais.
   */
  public async suiteOf(projectId: string): Promise<ISuite | null> {
    const path = (await this.read())[projectId];

    return path === undefined ? null : this.inspect({ projectId, path });
  }

  /**
   * A pasta da suíte a que um projeto está conectado, como a main a guarda; null para
   * nenhuma.
   */
  public async pathOf(projectId: string): Promise<string | null> {
    return (await this.read())[projectId] ?? null;
  }

  /**
   * Onde o Playwright Test em que uma suíte roda está instalado, na pasta dela ou numa
   * acima, com a versão; null até os pacotes dela serem instalados.
   */
  public async runnerOf(path: string): Promise<{ cli: string; version: string } | null> {
    for (const file of runnerPathsOf(path)) {
      const version = versionIn(await readFile(file, 'utf8').catch(() => ''));

      if (version !== null)
        return { cli: join(dirname(file), SUITE_REGISTRY.cli), version };
    }

    return null;
  }

  /** Esquece a suíte de um projeto; a pasta dela fica como o QA a deixou. */
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
    await writeAtomically({
      file: join(this.root, SUITE_REGISTRY.file),
      data: JSON.stringify(paths, null, 2),
    });
  }
}
