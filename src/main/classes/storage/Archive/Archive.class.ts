import type { ISavedState, ISavedWorkspace } from '@/shared/types';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ARCHIVE } from './constants';
import { isInside, readTextOr } from './library';

/** Everything QAzinho keeps between sessions, as files the QA can open, diff and commit. */
export class Archive {
  private readonly root: string;

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
    await mkdir(this.root, { recursive: true });
    await writeFile(join(this.root, ARCHIVE.projects), json, 'utf8');
  }

  public async saveWorkspace(saved: ISavedWorkspace): Promise<void> {
    const folder = this.folderOf(saved.id);

    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, ARCHIVE.workspace), saved.json, 'utf8');
    await writeFile(join(folder, ARCHIVE.plan), saved.planYaml, 'utf8');
  }

  public async removeWorkspace(id: string): Promise<void> {
    await rm(this.folderOf(id), { recursive: true, force: true });
  }

  /** The page cannot read disk, so a screenshot it no longer holds comes back inline. */
  public async readShot(file: string): Promise<string | null> {
    if (!isInside({ root: this.root, file })) return null;

    try {
      const image = await readFile(file);

      return `data:image/jpeg;base64,${image.toString('base64')}`;
    } catch {
      return null;
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
