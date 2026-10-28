import type { IJiraRead, IJiraStories, JiraStoryResult } from './types';
import type { IJiraFile, IJiraStoryCopy, JiraStep } from '@/shared/types';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { JIRA_FILES } from './constants';
import { fileNameOf, filesToReadOf } from './library';

/**
 * Lê uma história do Jira para o agente planejar, com os arquivos que ele consegue ler
 * baixados ao lado; os arquivos de cada história somem assim que o plano dela some.
 */
export class JiraStories {
  private readonly jira: IJiraRead;
  private readonly root: string;
  private readonly copies = new Map<string, IJiraStoryCopy>();

  public constructor(props: IJiraStories) {
    this.jira = props.jira;
    this.root = props.root;
  }

  /**
   * Lê uma história para um workspace e baixa os arquivos que consegue, no lugar de
   * qualquer história que o workspace tinha.
   */
  public async prepare(props: {
    workspaceId: string;
    key: string;
    onStep: (step: { at: JiraStep; bytes: number }) => void;
  }): Promise<JiraStoryResult> {
    const { workspaceId, onStep } = props;

    await this.release(workspaceId);
    onStep({ at: 'story', bytes: 0 });

    const read = await this.jira.story(props.key.trim().toUpperCase());

    if (!read.isRead) return { isReady: false, failure: read.failure };

    const root = join(this.root, workspaceId, read.story.key);
    const planned = filesToReadOf(read.story.attachments);
    const files: IJiraFile[] = [];
    const taken: string[] = [];
    let bytes = 0;

    if (planned.some(({ note }) => note === 'read')) {
      await mkdir(root, { recursive: true });
      onStep({ at: 'files', bytes: 0 });
    }

    for (const [index, file] of planned.entries()) {
      const attachment = read.story.attachments[index];

      if (file.note !== 'read' || attachment === undefined) {
        files.push(file);
        continue;
      }

      const name = fileNameOf({ filename: file.filename, taken });
      const path = join(root, name);
      const isSaved = await this.jira.download({
        id: attachment.id,
        file: path,
        maxBytes: JIRA_FILES.maxFileBytes,
      });

      taken.push(name.toLowerCase());
      bytes += isSaved ? file.size : 0;
      onStep({ at: 'files', bytes });
      files.push(isSaved ? { ...file, path } : { ...file, note: 'failed' });
    }

    const copy: IJiraStoryCopy = { story: read.story, root, files };

    this.copies.set(workspaceId, copy);

    return { isReady: true, copy };
  }

  public storyOf(workspaceId: string): IJiraStoryCopy | null {
    return this.copies.get(workspaceId) ?? null;
  }

  /** Solta a história de um workspace, e apaga os arquivos baixados para ela. */
  public async release(workspaceId: string): Promise<void> {
    this.copies.delete(workspaceId);
    await rm(join(this.root, workspaceId), { recursive: true, force: true });
  }

  /**
   * Apaga os arquivos de toda história que sobraram de antes, como de um QAzinho que
   * fechou no meio de um plano.
   */
  public async sweep(): Promise<void> {
    this.copies.clear();
    await rm(this.root, { recursive: true, force: true });
  }
}
