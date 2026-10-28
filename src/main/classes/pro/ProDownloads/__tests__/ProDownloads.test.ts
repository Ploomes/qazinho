import type { IProDownloads } from '@/main/classes/pro/ProDownloads';
import type { ProSync } from '@/main/classes/pro/ProSync';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ProDownloads } from '@/main/classes/pro/ProDownloads';
import { SYNCED } from '@/main/classes/pro/ProDownloads/library/__tests__/fixtures';

type Adopted = Parameters<ProSync['adopt']>[0];

/**
 * A org como os downloads a leem: os projetos dela, e as gravações de cada plano na main.
 */
function fakeApi(props: { status?: number; projects?: (typeof SYNCED)[] } = {}) {
  const asked: string[] = [];
  const api: IProDownloads['api'] = {
    syncedProjects: ({ org }) => {
      asked.push(`projects:${org}`);

      return Promise.resolve(
        props.status === undefined
          ? { isOk: true, value: { projects: props.projects ?? [SYNCED] } }
          : { isOk: false, status: props.status, error: 'refused' },
      );
    },
    recordings: ({ planId, branch }) => {
      asked.push(`recordings:${planId}:${branch}`);

      return Promise.resolve({
        isOk: true,
        value: {
          branch,
          recordings:
            planId === 'plan-1'
              ? [
                  {
                    caseId: 'TC-01',
                    fingerprint: 'fp',
                    targetKind: 'web' as const,
                    steps: [],
                    recordedAt: '2026-10-24T10:00:00.000Z',
                  },
                ]
              : [],
        },
      });
    },
  };

  return { api, asked };
}

async function downloadsWith(props: {
  api: IProDownloads['api'];
  token?: string | null;
}) {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-downloads-'));
  const adopted: Adopted[] = [];
  const downloads = new ProDownloads({
    api: props.api,
    token: () => Promise.resolve(props.token === undefined ? 'qzm_secret' : props.token),
    archiveRoot: root,
    sync: {
      adopt: (adopt) => {
        adopted.push(adopt);

        return Promise.resolve({
          projectId: adopt.projectId,
          orgSlug: adopt.orgSlug,
          state: 'synced',
          syncedAt: null,
          pending: [],
          conflicts: [],
        });
      },
    },
  });

  return { downloads, root, adopted };
}

describe('ProDownloads', () => {
  it('lists what the org holds, each plan by name and size', async () => {
    const { api } = fakeApi();
    const { downloads } = await downloadsWith({ api });

    expect(await downloads.list('loja')).toEqual({
      isListed: true,
      projects: [
        {
          orgSlug: 'loja',
          projectId: 'p-1760000000000',
          key: 'LOJA',
          name: 'Loja — staging',
          plans: [
            { workspaceId: 'w-1760000000001', name: 'Checkout com Pix', cases: 1 },
            { workspaceId: 'w-1760000000002', name: 'Login no app', cases: 0 },
          ],
        },
      ],
    });
  });

  it('leaves out a project or a plan whose id would not be a folder name here', async () => {
    const { api } = fakeApi({
      projects: [
        { ...SYNCED, desktopId: '../../escape' },
        { ...SYNCED, plans: [{ ...SYNCED.plans[0]!, desktopId: '../w' }] },
      ],
    });
    const { downloads } = await downloadsWith({ api });

    expect(await downloads.list('loja')).toMatchObject({
      isListed: true,
      projects: [{ projectId: 'p-1760000000000', plans: [] }],
    });
  });

  it('says why the list did not come, and asks nothing while signed out', async () => {
    const offline = fakeApi({ status: 0 });
    const signedOut = fakeApi();

    expect(
      await (await downloadsWith({ api: offline.api })).downloads.list('loja'),
    ).toEqual({
      isListed: false,
      failure: 'unreachable',
    });
    expect(
      await (
        await downloadsWith({ api: signedOut.api, token: null })
      ).downloads.list('loja'),
    ).toEqual({ isListed: false, failure: 'signed-out' });
    expect(signedOut.asked).toEqual([]);
  });

  it('downloads a project with its plans, its variables by name, and each plan’s recordings', async () => {
    const { api, asked } = fakeApi();
    const { downloads, root, adopted } = await downloadsWith({ api });

    const downloaded = await downloads.download({
      orgSlug: 'loja',
      projectId: 'p-1760000000000',
    });

    expect(downloaded).toMatchObject({
      isDownloaded: true,
      orgSlug: 'loja',
      project: { projectId: 'p-1760000000000', name: 'Loja — staging' },
      plans: [
        { workspaceId: 'w-1760000000001', targetId: 't-web' },
        { workspaceId: 'w-1760000000002', targetId: 't-android' },
      ],
      variables: [{ name: 'LOGIN_PASSWORD', description: 'senha do QA' }],
    });
    expect(asked).toEqual([
      'projects:loja',
      'recordings:plan-1:main',
      'recordings:plan-2:main',
    ]);
    expect(
      JSON.parse(
        await readFile(
          join(root, 'workspaces', 'w-1760000000001', 'recipes.json'),
          'utf8',
        ),
      ),
    ).toMatchObject({ cases: [{ caseId: 'TC-01', runId: 'org' }] });
    expect(adopted).toEqual([
      {
        projectId: 'p-1760000000000',
        orgSlug: 'loja',
        plans: [
          {
            workspaceId: 'w-1760000000001',
            planId: 'plan-1',
            version: 3,
            cases: SYNCED.plans[0]?.cases,
          },
          { workspaceId: 'w-1760000000002', planId: 'plan-2', version: 1, cases: [] },
        ],
      },
    ]);
  });

  it('does NOT write over recipes this computer already keeps', async () => {
    const { api } = fakeApi();
    const { downloads, root } = await downloadsWith({ api });
    const file = join(root, 'workspaces', 'w-1760000000001', 'recipes.json');

    await mkdir(join(root, 'workspaces', 'w-1760000000001'), { recursive: true });
    await writeFile(file, '{"cases":[]}');
    await downloads.download({ orgSlug: 'loja', projectId: 'p-1760000000000' });

    expect(await readFile(file, 'utf8')).toBe('{"cases":[]}');
  });

  it('does NOT download a project this computer already keeps, nor one gone from the org', async () => {
    const { api } = fakeApi();
    const { downloads, root, adopted } = await downloadsWith({ api });

    expect(await downloads.download({ orgSlug: 'loja', projectId: 'p-9' })).toEqual({
      isDownloaded: false,
      failure: 'gone',
    });

    await writeFile(join(root, 'projects.json'), '[{"id":"p-1760000000000"}]');

    expect(
      await downloads.download({ orgSlug: 'loja', projectId: 'p-1760000000000' }),
    ).toEqual({ isDownloaded: false, failure: 'here' });
    expect(adopted).toEqual([]);
  });
});
