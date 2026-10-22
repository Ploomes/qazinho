import type { IJiraRead } from '@/main/classes/integrations/JiraStories/types';
import type { IJiraStory } from '@/shared/types';
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JiraStories } from '@/main/classes/integrations/JiraStories';

const STORY: IJiraStory = {
  key: 'SHOP-12',
  url: 'https://acme.atlassian.net/browse/SHOP-12',
  summary: 'Aplicar cupom',
  type: 'Story',
  status: 'To Do',
  priority: 'High',
  labels: [],
  components: [],
  parent: '',
  description: 'O cliente aplica um cupom.',
  acceptance: [],
  comments: [],
  links: [],
  subtasks: [],
  attachments: [
    { id: '1', filename: 'tela.png', mimeType: 'image/png', size: 4 },
    { id: '2', filename: '../tela.png', mimeType: 'image/png', size: 4 },
    { id: '3', filename: 'demo.mp4', mimeType: 'video/mp4', size: 4 },
    { id: '4', filename: 'quebrado.pdf', mimeType: 'application/pdf', size: 4 },
  ],
};

/** A Jira that hands over SHOP-12, writes what each file holds, and fails one of them. */
function fakeJira(): IJiraRead & { asked: string[] } {
  const asked: string[] = [];

  return {
    asked,
    story: async (key) => {
      asked.push(key);

      return key === 'SHOP-12'
        ? { isRead: true, story: STORY }
        : { isRead: false, failure: 'not-found' };
    },
    download: async ({ id, file }) => {
      if (id === '4') return false;

      await writeFile(file, `file ${id}`);

      return true;
    },
  };
}

async function stories() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-jira-'));
  const jira = fakeJira();

  return { root, jira, stories: new JiraStories({ jira, root }) };
}

describe('JiraStories', () => {
  it('reads the story by its key, and downloads the files it can read beside it', async () => {
    const { root, jira, stories: kept } = await stories();
    const steps: string[] = [];
    const result = await kept.prepare({
      workspaceId: 'w1',
      key: ' shop-12 ',
      onStep: ({ at, bytes }) => steps.push(`${at} ${String(bytes)}`),
    });

    expect(jira.asked).toEqual(['SHOP-12']);
    expect(result.isReady).toBe(true);

    const files = result.isReady ? result.copy.files : [];
    const folder = join(root, 'w1', 'SHOP-12');

    expect(files.map(({ filename, note, path }) => [filename, note, path])).toEqual([
      ['tela.png', 'read', join(folder, 'tela.png')],
      ['../tela.png', 'read', join(folder, 'tela (2).png')],
      ['demo.mp4', 'not-readable', null],
      ['quebrado.pdf', 'failed', null],
    ]);
    expect(await readFile(join(folder, 'tela (2).png'), 'utf8')).toBe('file 2');
    expect(steps).toEqual(['story 0', 'files 0', 'files 4', 'files 8', 'files 8']);
    expect(kept.storyOf('w1')?.story.key).toBe('SHOP-12');
  });

  it('says why when Jira does not hand the story over, and keeps nothing', async () => {
    const { stories: kept } = await stories();
    const result = await kept.prepare({
      workspaceId: 'w1',
      key: 'SHOP-99',
      onStep: () => undefined,
    });

    expect(result).toEqual({ isReady: false, failure: 'not-found' });
    expect(kept.storyOf('w1')).toBeNull();
  });

  it('deletes a story and its files once let go, and everything on a sweep', async () => {
    const { root, stories: kept } = await stories();

    await kept.prepare({ workspaceId: 'w1', key: 'SHOP-12', onStep: () => undefined });
    await kept.prepare({ workspaceId: 'w2', key: 'SHOP-12', onStep: () => undefined });
    await kept.release('w1');

    expect(kept.storyOf('w1')).toBeNull();
    expect(await readdir(root)).toEqual(['w2']);

    await kept.sweep();

    expect(kept.storyOf('w2')).toBeNull();
    await expect(readdir(root)).rejects.toThrow();
  });
});
