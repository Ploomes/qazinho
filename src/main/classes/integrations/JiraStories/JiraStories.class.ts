import type { IJiraRead, IJiraStories, JiraStoryResult } from './types';
import type { IJiraFile, IJiraStoryCopy, JiraStep } from '@/shared/types';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { JIRA_FILES } from './constants';
import { fileNameOf, filesToReadOf } from './library';

/** Reads a Jira story for the agent to plan from, with the files it can read downloaded beside it; each story's files are gone once its plan is. */
export class JiraStories {
  private readonly jira: IJiraRead;
  private readonly root: string;
  private readonly copies = new Map<string, IJiraStoryCopy>();

  public constructor(props: IJiraStories) {
    this.jira = props.jira;
    this.root = props.root;
  }

  /** Reads a story for a workspace and downloads the files it can, in place of any story the workspace had. */
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

  /** Lets a workspace's story go, and deletes the files downloaded for it. */
  public async release(workspaceId: string): Promise<void> {
    this.copies.delete(workspaceId);
    await rm(join(this.root, workspaceId), { recursive: true, force: true });
  }

  /** Deletes every story's files left from before, such as from a QAzinho that closed mid-plan. */
  public async sweep(): Promise<void> {
    this.copies.clear();
    await rm(this.root, { recursive: true, force: true });
  }
}
