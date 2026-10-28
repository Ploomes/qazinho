import type { IFlatStep } from '@/shared/types';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CodeExport } from '@/main/classes/runs/CodeExport';
import { fingerprintOf } from '@/main/classes/runs/RunCoordinator/library';

const step = (caseId: string, number: number): IFlatStep => ({
  caseId,
  caseTitle: `Case ${caseId}`,
  casePriority: 'P1',
  caseGoal: '',
  casePreconditions: '',
  numberInCase: number,
  action: 'Tap Save visit',
  expected: 'Visits: 1',
});

const RECORDED = [step('TC-01', 1)];
const UNRECORDED = [step('TC-02', 1)];

/**
 * Uma pasta de dados cujo workspace guardou uma receita só para o TC-01, e uma pasta para
 * o QA escolher.
 */
async function world(kind: 'web' | 'android') {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-export-'));
  const picked = join(root, 'picked');
  const folder = join(root, 'workspaces', 'w-1');

  await mkdir(folder, { recursive: true });
  await mkdir(picked);
  await writeFile(
    join(folder, 'recipes.json'),
    JSON.stringify({
      cases: [
        {
          caseId: 'TC-01',
          fingerprint: fingerprintOf({ targetKind: kind, steps: RECORDED }),
          targetKind: kind,
          steps: [
            {
              number: 1,
              actions: [{ kind: 'click', target: 'Save visit', value: '' }],
              proof: 'Visits: 1',
            },
          ],
          runId: 'r-01',
          recordedAt: 0,
        },
      ],
    }),
  );

  return { root, picked };
}

const request = (kind: 'web' | 'android') => ({
  workspaceId: 'w-1',
  target: { kind, value: kind === 'web' ? 'https://loja.test/' : '/apps/visitas.apk' },
  viewport: { width: 1280, height: 800 },
  steps: [...RECORDED, ...UNRECORDED],
});

describe('CodeExport', () => {
  it('writes the recorded cases of a web app as one Playwright file, and names the ones not recorded yet', async () => {
    const { root, picked } = await world('web');
    const exporter = new CodeExport({
      dataRoot: root,
      chooseFolder: () => Promise.resolve(picked),
      appIdOf: () => Promise.resolve(null),
    });

    expect(await exporter.export(request('web'))).toEqual({
      kind: 'saved',
      folder: picked,
      files: ['qazinho.spec.ts'],
      exported: ['TC-01'],
      missing: ['TC-02'],
    });
    expect(await readFile(join(picked, 'qazinho.spec.ts'), 'utf8')).toContain(
      'await control(tab, "Save visit").click();',
    );
  });

  it('puts the sample file an upload picked beside the test that uses it', async () => {
    const { root, picked } = await world('web');
    const book = join(root, 'workspaces', 'w-1', 'recipes.json');
    const kept = JSON.parse(await readFile(book, 'utf8')) as {
      cases: { steps: { actions: unknown[] }[] }[];
    };

    kept.cases[0]?.steps[0]?.actions.push({
      kind: 'upload',
      target: 'Foto',
      value: 'pdf',
    });
    await writeFile(book, JSON.stringify(kept));

    const exporter = new CodeExport({
      dataRoot: root,
      chooseFolder: () => Promise.resolve(picked),
      appIdOf: () => Promise.resolve(null),
    });

    expect(await exporter.export(request('web'))).toMatchObject({
      files: ['qazinho.spec.ts', 'files/qazinho-sample.pdf'],
    });
    expect(
      (await readFile(join(picked, 'files', 'qazinho-sample.pdf')))
        .subarray(0, 5)
        .toString(),
    ).toBe('%PDF-');
  });

  it('writes a Maestro flow per recorded case of a phone app, with the id read from its file', async () => {
    const { root, picked } = await world('android');
    const exporter = new CodeExport({
      dataRoot: root,
      chooseFolder: () => Promise.resolve(picked),
      appIdOf: () => Promise.resolve('app.qazinho.visitas'),
    });

    expect(await exporter.export(request('android'))).toMatchObject({
      kind: 'saved',
      files: ['tc-01.yaml'],
    });
    expect(await readFile(join(picked, 'tc-01.yaml'), 'utf8')).toContain(
      'appId: app.qazinho.visitas',
    );
  });

  it('does NOT ask for a folder when no case was recorded, or when the app id cannot be read', async () => {
    const { root, picked } = await world('web');
    let asked = 0;
    const exporter = new CodeExport({
      dataRoot: root,
      chooseFolder: () => {
        asked += 1;

        return Promise.resolve(picked);
      },
      appIdOf: () => Promise.resolve(null),
    });

    expect(await exporter.export({ ...request('web'), steps: UNRECORDED })).toEqual({
      kind: 'nothing',
      missing: ['TC-02'],
    });
    expect(await exporter.export({ ...request('android'), workspaceId: 'w-1' })).toEqual({
      kind: 'nothing',
      missing: ['TC-01', 'TC-02'],
    });
    expect(asked).toBe(0);
  });

  it('writes nothing when the QA calls the folder off', async () => {
    const { root, picked } = await world('web');
    const exporter = new CodeExport({
      dataRoot: root,
      chooseFolder: () => Promise.resolve(null),
      appIdOf: () => Promise.resolve(null),
    });

    expect(await exporter.export(request('web'))).toEqual({ kind: 'cancelled' });
    expect(await readdir(picked)).toEqual([]);
  });

  it('says so when the app id of a phone app cannot be read', async () => {
    const { root, picked } = await world('android');
    const exporter = new CodeExport({
      dataRoot: root,
      chooseFolder: () => Promise.resolve(picked),
      appIdOf: () => Promise.resolve(null),
    });

    expect(await exporter.export(request('android'))).toEqual({
      kind: 'failed',
      reason: 'app-id',
    });
  });
});
