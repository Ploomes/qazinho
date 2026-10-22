import { describe, expect, it } from 'vitest';
import { suiteTreeOf } from '@/modules/Automation/library';
import { suiteTest } from './fixtures';

const TESTS = [
  suiteTest({
    id: 'b',
    file: 'tests/hc-15/ct-edt.spec.ts',
    line: 30,
    title: 'CT-EDT-002 · Salva',
  }),
  suiteTest({
    id: 'a',
    file: 'tests/hc-15/ct-edt.spec.ts',
    line: 8,
    title: 'CT-EDT-001 · Edita',
  }),
  suiteTest({
    id: 'c',
    file: 'tests/hc-1139/ct-nav.spec.ts',
    line: 5,
    title: 'CT-NAV-001 · Pastas',
    tags: ['altera-dados'],
  }),
  suiteTest({
    id: 'd',
    file: 'tests/hc-1139/ct-fil.spec.ts',
    line: 5,
    title: 'CT-FIL-001 · Filtra',
  }),
];

describe('suiteTreeOf', () => {
  it('groups the tests by folder and file, in path order, each file in the order it is written', () => {
    expect(
      suiteTreeOf({ tests: TESTS, query: '' }).map(({ name, files }) => ({
        name,
        files: files.map((file) => ({
          name: file.name,
          tests: file.tests.map(({ id }) => id),
        })),
      })),
    ).toEqual([
      {
        name: 'hc-1139',
        files: [
          { name: 'ct-fil.spec.ts', tests: ['d'] },
          { name: 'ct-nav.spec.ts', tests: ['c'] },
        ],
      },
      { name: 'hc-15', files: [{ name: 'ct-edt.spec.ts', tests: ['a', 'b'] }] },
    ]);
  });

  it('keeps the tests whose title, file or tag holds the query, whatever its case', () => {
    const ids = (query: string) =>
      suiteTreeOf({ tests: TESTS, query }).flatMap(({ files }) =>
        files.flatMap(({ tests }) => tests.map(({ id }) => id)),
      );

    expect(ids('ct-edt-002')).toEqual(['b']);
    expect(ids('hc-1139/ct-fil')).toEqual(['d']);
    expect(ids('@altera')).toEqual(['c']);
    expect(ids('navegação')).toEqual(['d', 'c', 'a', 'b']);
  });

  it('leaves out a folder with nothing the query keeps', () => {
    expect(suiteTreeOf({ tests: TESTS, query: 'salva' }).map(({ name }) => name)).toEqual(
      ['hc-15'],
    );
  });

  it('names a test at the suite root after its folder path', () => {
    expect(
      suiteTreeOf({ tests: [suiteTest({ file: 'smoke.spec.ts' })], query: '' })[0],
    ).toMatchObject({ path: '', name: '' });
  });
});
