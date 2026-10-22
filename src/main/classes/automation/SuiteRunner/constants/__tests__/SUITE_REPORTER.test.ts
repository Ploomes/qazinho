import { mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SUITE_REPORTER } from '@/main/classes/automation/SuiteRunner/constants';
import { suiteReportOf } from '@/main/classes/automation/SuiteRunner/library';

interface IReporter {
  printsToStdio: () => boolean;
  onBegin: (config: object, suite: { allTests: () => unknown[] }) => void;
  onTestBegin: (test: object, result: { retry: number }) => void;
  onStepBegin: (
    ...args: [test: object, result: object, step: { category: string; title: string }]
  ) => void;
  onTestEnd: (test: object, result: object) => void;
  onError: (error: { message: string }) => void;
  onEnd: (result: { status: string }) => void;
}

/** The reporter as Playwright loads it: written to a file of its own and required, printing through the `out` a test hands it. */
function reporter() {
  const folder = mkdtempSync(join(tmpdir(), 'qz-reporter-'));
  const file = join(folder, SUITE_REPORTER.file);

  writeFileSync(file, SUITE_REPORTER.source);

  const Reporter = createRequire(import.meta.url)(file) as new (options: {
    out: (line: string) => void;
  }) => IReporter;
  const lines: string[] = [];

  return { lines, reporter: new Reporter({ out: (line) => lines.push(line) }) };
}

const TEST = {
  id: 't-1',
  title: 'CT-NAV-002 · Abre o carrinho',
  location: { file: '/qa/e2e/tests/hc-1/ct-nav.spec.ts', line: 12 },
  parent: { project: () => ({ name: 'chromium' }) },
  outcome: () => 'unexpected',
};

describe('SUITE_REPORTER', () => {
  it('prints every event on a line of its own that QAzinho reads back', () => {
    const { lines, reporter: one } = reporter();

    one.onBegin({}, { allTests: () => [1, 2, 3] });
    one.onTestBegin(TEST, { retry: 0 });
    one.onEnd({ status: 'passed' });

    expect(
      lines.every(
        (line) => line.startsWith(SUITE_REPORTER.prefix) && line.endsWith('\n'),
      ),
    ).toBe(true);
    expect(lines.map((line) => suiteReportOf(line.trimEnd()))).toEqual([
      { kind: 'begin', total: 3 },
      { kind: 'test-begin', id: 't-1', retry: 0 },
      { kind: 'end', status: 'passed' },
    ]);
  });

  it('says only the steps a QA wrote and the checks, never each call of the page', () => {
    const { lines, reporter: one } = reporter();

    one.onStepBegin(TEST, {}, { category: 'pw:api', title: 'Click' });
    one.onStepBegin(
      TEST,
      {},
      { category: 'test.step', title: 'Abrir o \u001b[2mmenu\u001b[22m' },
    );
    one.onStepBegin(TEST, {}, { category: 'expect', title: 'Expect "toBeVisible"' });

    expect(lines.map((line) => suiteReportOf(line.trimEnd()))).toEqual([
      { kind: 'step', id: 't-1', title: 'Abrir o menu' },
      { kind: 'step', id: 't-1', title: 'Expect "toBeVisible"' },
    ]);
  });

  it('ends a test with how it went, its first error with no colours, and the files it left', () => {
    const { lines, reporter: one } = reporter();

    one.onTestEnd(TEST, {
      status: 'failed',
      retry: 1,
      duration: 1234.6,
      errors: [
        { message: '\u001b[31mTimeoutError\u001b[39m: locator.click' },
        { message: 'second' },
      ],
      attachments: [
        {
          name: 'screenshot',
          contentType: 'image/png',
          path: '/out/a/test-failed-1.png',
        },
        { name: 'note', contentType: 'text/plain', body: 'kept in memory' },
      ],
    });

    expect(suiteReportOf(lines[0]?.trimEnd() ?? '')).toEqual({
      kind: 'test-end',
      id: 't-1',
      title: 'CT-NAV-002 · Abre o carrinho',
      file: '/qa/e2e/tests/hc-1/ct-nav.spec.ts',
      line: 12,
      project: 'chromium',
      status: 'failed',
      outcome: 'unexpected',
      retry: 1,
      durationMs: 1235,
      error: 'TimeoutError: locator.click',
      attachments: [
        {
          name: 'screenshot',
          contentType: 'image/png',
          path: '/out/a/test-failed-1.png',
        },
      ],
    });
  });

  it('ends a test that threw nothing with no error, in a config with no project', () => {
    const { lines, reporter: one } = reporter();

    one.onTestEnd(
      { ...TEST, parent: { project: () => undefined }, outcome: () => 'expected' },
      { status: 'passed', retry: 0, duration: 10, errors: [], attachments: [] },
    );

    expect(suiteReportOf(lines[0]?.trimEnd() ?? '')).toMatchObject({
      project: '',
      error: null,
    });
  });

  it('tells an error the run hit outside any test', () => {
    const { lines, reporter: one } = reporter();

    one.onError({ message: 'Error: Cannot find module dotenv' });

    expect(suiteReportOf(lines[0]?.trimEnd() ?? '')).toEqual({
      kind: 'error',
      message: 'Error: Cannot find module dotenv',
    });
  });

  it('leaves no other reporter printing beside it', () => {
    expect(reporter().reporter.printsToStdio()).toBe(true);
  });
});
