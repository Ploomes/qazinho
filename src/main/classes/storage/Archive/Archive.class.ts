import type {
  INetworkEntry,
  IRunRef,
  ISavedState,
  ISavedWorkspace,
} from '@/shared/types';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ARCHIVE } from './constants';
import { isInside, networkOf, readTextOr } from './library';

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
      await writeFile(join(this.root, ARCHIVE.projects), json, 'utf8');
    });
  }

  public async saveWorkspace(saved: ISavedWorkspace): Promise<void> {
    const folder = this.folderOf(saved.id);

    await this.track(async () => {
      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, ARCHIVE.workspace), saved.json, 'utf8');
      await writeFile(join(folder, ARCHIVE.plan), saved.planYaml, 'utf8');
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
        planYaml: await readTextOr({
          file: join(folder, id, ARCHIVE.plan),
          fallback: '',
        }),
      })),
    );

    return saved.filter(({ json }) => json.length > 0);
  }
}
