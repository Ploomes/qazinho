import { describe, expect, it } from 'vitest';
import { batchesOf } from '@/modules/Automation/library';
import { suiteTest } from './fixtures';

const TESTS = [
  suiteTest({
    id: 'a',
    file: 'tests/hc-15/ct-edt.spec.ts',
    line: 8,
    project: 'chromium',
  }),
  suiteTest({
    id: 'b',
    file: 'tests/hc-15/ct-edt.spec.ts',
    line: 30,
    project: 'salva-versao',
  }),
  suiteTest({
    id: 'c',
    file: 'tests/hc-1139/ct-nav.spec.ts',
    line: 5,
    project: 'chromium',
  }),
];
const PROJECTS = ['chromium', 'salva-versao'];

describe('batchesOf', () => {
  /** O time de QA roda o projeto que muda dados depois do que só lê, um de cada vez. */
  it('runs the whole suite a project at a time, in the order the config declares them', () => {
    expect(
      batchesOf({ tests: TESTS, projects: PROJECTS, scope: { kind: 'all' } }),
    ).toEqual([
      { project: 'chromium', filters: [] },
      { project: 'salva-versao', filters: [] },
    ]);
  });

  it('runs a whole suite in a config with no project', () => {
    expect(batchesOf({ tests: [], projects: [], scope: { kind: 'all' } })).toEqual([
      { project: '', filters: [] },
    ]);
  });

  it('runs a folder in each project that holds its tests, and no other', () => {
    expect(
      batchesOf({
        tests: TESTS,
        projects: PROJECTS,
        scope: { kind: 'path', path: 'tests/hc-1139' },
      }),
    ).toEqual([{ project: 'chromium', filters: ['tests/hc-1139/ct-nav.spec.ts'] }]);
  });

  /**
   * A árvore mostra cada pasta numa linha própria, então a run dela pega o que a linha
   * mostra: nunca uma pasta dentro dela, nem uma cujo nome começa igual.
   */
  it('runs the files a folder holds itself, and no folder inside it or beside it', () => {
    const tests = [
      suiteTest({ id: 'a', file: 'tests/hc-1/a.spec.ts', line: 3 }),
      suiteTest({ id: 'b', file: 'tests/hc-1/a.spec.ts', line: 9 }),
      suiteTest({ id: 'c', file: 'tests/hc-1/old/b.spec.ts' }),
      suiteTest({ id: 'd', file: 'tests/hc-12/c.spec.ts' }),
    ];

    expect(
      batchesOf({
        tests,
        projects: ['chromium'],
        scope: { kind: 'path', path: 'tests/hc-1' },
      }),
    ).toEqual([{ project: 'chromium', filters: ['tests/hc-1/a.spec.ts'] }]);
  });

  it('runs the files at the root of the suite as a folder of their own', () => {
    const tests = [
      suiteTest({ id: 'a', file: 'login.spec.ts', project: '' }),
      suiteTest({ id: 'b', file: 'tests/cart.spec.ts', project: '' }),
    ];

    expect(batchesOf({ tests, projects: [], scope: { kind: 'path', path: '' } })).toEqual(
      [{ project: '', filters: ['login.spec.ts'] }],
    );
  });

  it('runs tests by where each is written, in its own project', () => {
    expect(
      batchesOf({
        tests: TESTS,
        projects: PROJECTS,
        scope: { kind: 'tests', testIds: ['b', 'c', 'a'] },
      }),
    ).toEqual([
      {
        project: 'chromium',
        filters: ['tests/hc-15/ct-edt.spec.ts:8', 'tests/hc-1139/ct-nav.spec.ts:5'],
      },
      { project: 'salva-versao', filters: ['tests/hc-15/ct-edt.spec.ts:30'] },
    ]);
  });

  it('runs nothing for tests it does not know', () => {
    expect(
      batchesOf({
        tests: TESTS,
        projects: PROJECTS,
        scope: { kind: 'tests', testIds: ['zz'] },
      }),
    ).toEqual([]);
  });
});
