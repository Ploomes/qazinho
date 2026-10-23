import type {
  INetworkEntry,
  IRunRef,
  ISavedState,
  ISavedWorkspace,
  UnreadPlanRead,
} from '@/shared/types';
import { mkdir, readdir, readFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { writeAtomically } from '@/main/library';
import { ARCHIVE } from './constants';
import { asideNameOf, isInside, networkOf, planFaultOf, readTextOr } from './library';

/** Everything QAzinho keeps between sessions, as files the QA can open, diff and commit. */
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

  /** Whether a save is still on its way to disk. */
  public isWriting(): boolean {
    return this.writing.size > 0;
  }

  /** Waits for every save on its way to disk, so quitting never cuts one in half. */
  public async settle(): Promise<void> {
    await Promise.allSettled([...this.writing]);
  }

  /** Takes a workspace off the disk with the screenshots of its runs. */
  public async removeWorkspace(id: string): Promise<void> {
    await rm(this.folderOf(id), { recursive: true, force: true });
    await rm(join(this.root, ARCHIVE.runs, id), { recursive: true, force: true });
  }

  /** The requests a web run kept beside its video; null for a run that kept none, such as one on a phone. */
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

  /** A plan set aside, read again once the QA fixed it; one that reads now leaves the folder, since the plan it holds is the workspace's again. */
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

  /** Where a plan set aside sits, for the QA to open it; null for a name QAzinho never gave one. */
  public unreadPlanFile(props: { workspaceId: string; file: string }): string | null {
    if (
      !ARCHIVE.unreadPlan.test(props.file) ||
      !ARCHIVE.workspaceId.test(props.workspaceId)
    )
      return null;

    const file = join(this.folderOf(props.workspaceId), props.file);

    return isInside({ root: this.root, file }) ? file : null;
  }

  /** The page cannot read disk, so a screenshot it no longer holds comes back inline. */
  public async readShot(file: string): Promise<string | null> {
    const image = await this.readShotBytes(file);

    return image === null ? null : `data:image/jpeg;base64,${image.toString('base64')}`;
  }

  /** A screenshot's own bytes, read only from inside the archive. */
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

    await rename(plan, join(folder, file));

    return { planYaml: '', unreadPlan: { file, line: fault.line } };
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

    await rename(join(folder, file), join(folder, ARCHIVE.plan));

    return { planYaml: yaml };
  }
}
