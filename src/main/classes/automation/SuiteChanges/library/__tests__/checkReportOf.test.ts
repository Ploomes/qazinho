import type { ISuiteResult } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { checkReportOf } from '@/main/classes/automation/SuiteChanges/library';

const result = (props: Partial<ISuiteResult>): ISuiteResult => ({
  testId: 't-1',
  title: 'CT-NAV-002 · Abre o carrinho',
  file: 'tests/hc-1/ct-nav.spec.ts',
  line: 13,
  project: 'chromium',
  status: 'passed',
  isFlaky: false,
  durationMs: 2_340,
  error: null,
  attachments: [],
  ...props,
});

const KEY = {
  name: 'USER_KEY',
  description: 'The session cookie',
  value: 'k3y-of-the-qa-9',
};

describe('checkReportOf', () => {
  it('says how many ran and how each ended', () => {
    expect(
      checkReportOf({
        tests: [
          { result: result({}), notes: '', screenshots: [] },
          {
            result: result({ title: 'CT-NAV-003', isFlaky: true }),
            notes: '',
            screenshots: [],
          },
        ],
        failure: null,
        said: '',
        values: [],
      }),
    ).toBe(
      [
        'Ran 2 tests: 2 passed, 0 failed, 0 skipped.',
        '',
        '### CT-NAV-002 · Abre o carrinho',
        'tests/hc-1/ct-nav.spec.ts:13, project chromium: passed in 2.3 s.',
        '',
        '### CT-NAV-003',
        'tests/hc-1/ct-nav.spec.ts:13, project chromium: passed on a retry in 2.3 s.',
      ].join('\n'),
    );
  });

  it('gives a failure its error, what Playwright noted, and where its screenshot is', () => {
    const text = checkReportOf({
      tests: [
        {
          result: result({
            status: 'timedOut',
            error: 'Test timeout of 20000ms exceeded.',
          }),
          notes: '# Page snapshot\n\n```yaml\n- link "Carrinho 0"\n```',
          screenshots: ['/data/checks/1/output/a/test-failed-1.png'],
        },
      ],
      failure: null,
      said: '',
      values: [],
    });

    expect(text).toContain('Ran 1 test: 0 passed, 1 failed, 0 skipped.');
    expect(text).toContain('timed out in 2.3 s.');
    expect(text).toContain('Error:\n```\nTest timeout of 20000ms exceeded.\n```');
    expect(text).toContain('````markdown\n# Page snapshot');
    expect(text).toContain('Screenshot: /data/checks/1/output/a/test-failed-1.png');
  });

  /**
   * Os testes leem as variáveis do ambiente, e um erro pode imprimir uma: o agente lê o
   * nome dela.
   */
  it("reads a variable's value back as its name, wherever it shows", () => {
    const text = checkReportOf({
      tests: [
        {
          result: result({ status: 'failed', error: `Expected "x", got "${KEY.value}"` }),
          notes: `- textbox "Chave": ${KEY.value}`,
          screenshots: [],
        },
      ],
      failure: null,
      said: '',
      values: [KEY],
    });

    expect(text).not.toContain(KEY.value);
    expect(text).toContain('got "${USER_KEY}"');
    expect(text).toContain('- textbox "Chave": ${USER_KEY}');
  });

  it('says why no test ran, with what Playwright said', () => {
    expect(
      checkReportOf({
        tests: [],
        failure: 'unreadable',
        said: `SyntaxError in ${KEY.value}.spec.ts`,
        values: [KEY],
      }),
    ).toBe(
      [
        'No test ran: Playwright could not read the suite.',
        'Playwright said:',
        '```',
        'SyntaxError in ${USER_KEY}.spec.ts',
        '```',
      ].join('\n'),
    );
    expect(checkReportOf({ tests: [], failure: null, said: '', values: [] })).toBe(
      'No test ran.',
    );
  });
});
