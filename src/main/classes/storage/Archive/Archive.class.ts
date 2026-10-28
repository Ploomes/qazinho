import type {
  INetworkEntry,
  IRunRef,
  ISavedState,
  ISavedWorkspace,
  UnreadPlanRead,
} from '@/shared/types';
import { copyFile, mkdir, readdir, readFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { writeAtomically } from '@/main/library';
import { ARCHIVE } from './constants';
import { asideNameOf, isInside, networkOf, planFaultOf, readTextOr } from './library';

/**
 * Tudo o que o QAzinho guarda entre sessões, como arquivos que o QA pode abrir, comparar
 * e commitar.
 */
export class Archive {
  private readonly root: string;
  private readonly writing = new Set<Promise<void>>();

  public constructor(root: string) {
    this.root = root;
  }

  public async read(): Promise<ISavedState> {
    return {
      projects: await readTextOr({
        file: join(this.root, ARCHIVE.projects),
        fallback: '[]',
      }),
      workspaces: await this.readWorkspaces(),
    };
  }

  public async saveProjects(json: string): Promise<void> {
    await this.track(async () => {
      await mkdir(this.root, { recursive: true });
      await writeAtomically({ file: join(this.root, ARCHIVE.projects), data: json });
    });
  }

  public async saveWorkspace(saved: ISavedWorkspace): Promise<void> {
    const folder = this.folderOf(saved.id);

    await this.track(async () => {
      await mkdir(folder, { recursive: true });
      await writeAtomically({ file: join(folder, ARCHIVE.workspace), data: saved.json });
      await writeAtomically({ file: join(folder, ARCHIVE.plan), data: saved.planYaml });
    });
  }

  /** Se um salvamento ainda está a caminho do disco. */
  public isWriting(): boolean {
    return this.writing.size > 0;
  }

  /**
   * Espera todo salvamento a caminho do disco, para fechar o app nunca cortar um ao meio.
   */
  public async settle(): Promise<void> {
    await Promise.allSettled([...this.writing]);
  }

  /** Tira um workspace do disco com os screenshots das runs dele. */
  public async removeWorkspace(id: string): Promise<void> {
    await rm(this.folderOf(id), { recursive: true, force: true });
    await rm(join(this.root, ARCHIVE.runs, id), { recursive: true, force: true });
  }

  /**
   * Os pedidos que uma run web guardou ao lado do vídeo; null para uma run que não
   * guardou nenhum, como uma num celular.
   */
  public async readNetwork(run: IRunRef): Promise<INetworkEntry[] | null> {
    const file = join(
      this.root,
      ARCHIVE.runs,
      run.workspaceId,
      run.runId,
      ARCHIVE.network,
    );

    if (!isInside({ root: this.root, file })) return null;

    const text = await readFile(file, 'utf8').catch(() => null);

    return text === null ? null : networkOf(text);
  }

  /**
   * Um plano posto de lado, lido de novo depois que o QA o consertou; um que agora lê sai
   * da pasta, já que o plano dele é do workspace de novo.
   */
  public async readUnreadPlan(props: {
    workspaceId: string;
    file: string;
  }): Promise<UnreadPlanRead> {
    const file = this.unreadPlanFile(props);
    const yaml = file === null ? null : await readFile(file, 'utf8').catch(() => null);

    if (file === null || yaml === null) return { status: 'gone' };

    const fault = planFaultOf(yaml);

    if (fault !== null) return { status: 'unreadable', line: fault.line };

    await rm(file, { force: true });

    return { status: 'read', yaml };
  }

  /**
   * Onde está um plano posto de lado, para o QA abri-lo; null para um nome que o QAzinho
   * nunca deu.
   */
  public unreadPlanFile(props: { workspaceId: string; file: string }): string | null {
    if (
      !ARCHIVE.unreadPlan.test(props.file) ||
      !ARCHIVE.workspaceId.test(props.workspaceId)
    )
      return null;

    const file = join(this.folderOf(props.workspaceId), props.file);

    return isInside({ root: this.root, file }) ? file : null;
  }

  /**
   * A página não lê disco, então um screenshot que ela não guarda mais volta embutido.
   */
  public async readShot(file: string): Promise<string | null> {
    const image = await this.readShotBytes(file);

    return image === null ? null : `data:image/jpeg;base64,${image.toString('base64')}`;
  }

  /** Os bytes de um screenshot, lidos só de dentro do arquivo. */
  public async readShotBytes(file: string): Promise<Buffer | null> {
    if (!isInside({ root: this.root, file })) return null;

    return readFile(file).catch(() => null);
  }

  private async track(write: () => Promise<void>): Promise<void> {
    const writing = write();

    this.writing.add(writing);

    try {
      await writing;
    } finally {
      this.writing.delete(writing);
    }
  }

  private folderOf(id: string): string {
    return join(this.root, ARCHIVE.workspaces, id);
  }

  private async readWorkspaces(): Promise<ISavedWorkspace[]> {
    const folder = join(this.root, ARCHIVE.workspaces);

    let ids: string[];

    try {
      ids = (await readdir(folder, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      return [];
    }

    const saved = await Promise.all(
      ids.map(async (id) => ({
        id,
        json: await readTextOr({
          file: join(folder, id, ARCHIVE.workspace),
          fallback: '',
        }),
        ...(await this.readPlan(join(folder, id))),
      })),
    );

    return saved.filter(({ json }) => json.length > 0);
  }

  private async readPlan(
    folder: string,
  ): Promise<Pick<ISavedWorkspace, 'planYaml' | 'unreadPlan'>> {
    const plan = join(folder, ARCHIVE.plan);
    const planYaml = await readFile(plan, 'utf8').catch(() => null);

    if (planYaml === null) return this.readAside(folder);

    const fault = planFaultOf(planYaml);

    if (fault === null) return { planYaml };

    const file = asideNameOf(new Date());
    const isAside = await rename(plan, join(folder, file)).then(
      () => true,
      () =>
        copyFile(plan, join(folder, file)).then(
          () => true,
          () => false,
        ),
    );

    return isAside
      ? { planYaml: '', unreadPlan: { file, line: fault.line } }
      : { planYaml };
  }

  private async readAside(
    folder: string,
  ): Promise<Pick<ISavedWorkspace, 'planYaml' | 'unreadPlan'>> {
    const file = (await readdir(folder).catch(() => []))
      .filter((name) => ARCHIVE.unreadPlan.test(name))
      .sort()
      .at(-1);
    const yaml =
      file === undefined
        ? null
        : await readFile(join(folder, file), 'utf8').catch(() => null);

    if (file === undefined || yaml === null) return { planYaml: '' };

    const fault = planFaultOf(yaml);

    if (fault !== null) return { planYaml: '', unreadPlan: { file, line: fault.line } };

    await rename(join(folder, file), join(folder, ARCHIVE.plan)).catch(() => undefined);

    return { planYaml: yaml };
  }
}
