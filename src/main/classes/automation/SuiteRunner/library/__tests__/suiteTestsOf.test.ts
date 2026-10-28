import { describe, expect, it } from 'vitest';
import { suiteTestsOf } from '@/main/classes/automation/SuiteRunner/library';

const spec = (props: {
  id: string;
  title: string;
  line: number;
  tags?: string[];
  projects: string[];
}) => ({
  id: props.id,
  title: props.title,
  file: 'hc-1139/ct-nav.spec.ts',
  line: props.line,
  column: 7,
  ok: true,
  tags: props.tags ?? [],
  tests: props.projects.map((projectName) => ({
    projectName,
    status: 'skipped',
    results: [],
  })),
});

/**
 * O formato que o Playwright 1.63 imprime para `test --list --reporter=json`, reduzido ao
 * que é lido.
 */
const REPORT = {
  config: {
    rootDir: '/qa/e2e/tests',
    projects: [{ name: 'chromium' }, { name: 'salva-versao' }],
  },
  suites: [
    {
      title: 'hc-1139/ct-nav.spec.ts',
      file: 'hc-1139/ct-nav.spec.ts',
      specs: [
        spec({
          id: 'a-0',
          title: 'CT-NAV-000 · Top level',
          line: 2,
          projects: ['chromium'],
        }),
      ],
      suites: [
        {
          title: 'CT-NAV · Seção Pastas',
          file: 'hc-1139/ct-nav.spec.ts',
          specs: [
            spec({
              id: 'a-1',
              title: 'CT-NAV-001 · Pastas no topo',
              line: 20,
              projects: ['chromium'],
            }),
            spec({
              id: 'a-2',
              title: 'CT-NAV-002 · Cria pasta @altera-dados',
              line: 40,
              tags: ['altera-dados', 'lento'],
              projects: ['salva-versao'],
            }),
          ],
          suites: [],
        },
      ],
    },
  ],
  errors: [],
};

describe('suiteTestsOf', () => {
  it('lists each test with its file from the suite folder, its line and the describes around it', () => {
    const listed = suiteTestsOf({ text: JSON.stringify(REPORT), root: '/qa/e2e' });

    expect(
      listed?.tests.map(({ id, file, line, path }) => ({ id, file, line, path })),
    ).toEqual([
      { id: 'a-0', file: 'tests/hc-1139/ct-nav.spec.ts', line: 2, path: [] },
      {
        id: 'a-1',
        file: 'tests/hc-1139/ct-nav.spec.ts',
        line: 20,
        path: ['CT-NAV · Seção Pastas'],
      },
      {
        id: 'a-2',
        file: 'tests/hc-1139/ct-nav.spec.ts',
        line: 40,
        path: ['CT-NAV · Seção Pastas'],
      },
    ]);
  });

  it('keeps the tags and the project a test runs in', () => {
    const [, , changing] =
      suiteTestsOf({ text: JSON.stringify(REPORT), root: '/qa/e2e' })?.tests ?? [];

    expect(changing).toMatchObject({
      title: 'CT-NAV-002 · Cria pasta @altera-dados',
      tags: ['altera-dados', 'lento'],
      project: 'salva-versao',
    });
  });

  /**
   * O Playwright lista um teste uma vez por projeto em que roda, cada um com um id
   * próprio: o que o reporter dele ouve.
   */
  it('lists a test running in two projects twice, once in each', () => {
    const both = {
      ...REPORT,
      suites: [
        {
          title: 'a.spec.ts',
          specs: [
            spec({ id: 'b-1', title: 'Same', line: 3, projects: ['chromium'] }),
            spec({ id: 'b-2', title: 'Same', line: 3, projects: ['firefox'] }),
          ],
          suites: [],
        },
      ],
    };

    expect(
      suiteTestsOf({ text: JSON.stringify(both), root: '/qa/e2e' })?.tests.map(
        ({ id, project }) => ({ id, project }),
      ),
    ).toEqual([
      { id: 'b-1', project: 'chromium' },
      { id: 'b-2', project: 'firefox' },
    ]);
  });

  it('names the projects in the order the config declares them', () => {
    expect(
      suiteTestsOf({ text: JSON.stringify(REPORT), root: '/qa/e2e' })?.projects,
    ).toEqual(['chromium', 'salva-versao']);
  });

  it('skips an entry it cannot read, and keeps the rest', () => {
    const broken = {
      ...REPORT,
      suites: [
        { title: 'x.spec.ts', specs: [{ title: 'no id' }, 7, null], suites: ['nope'] },
      ],
    };

    expect(
      suiteTestsOf({ text: JSON.stringify(broken), root: '/qa/e2e' })?.tests,
    ).toEqual([]);
  });

  it('reads nothing from text that is not a report', () => {
    expect(suiteTestsOf({ text: 'Error: Cannot find module', root: '/qa' })).toBeNull();
    expect(suiteTestsOf({ text: '{"errors":[]}', root: '/qa' })).toBeNull();
  });
});
