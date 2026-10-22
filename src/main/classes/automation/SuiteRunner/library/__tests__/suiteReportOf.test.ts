import { describe, expect, it } from 'vitest';
import { SUITE_REPORTER } from '@/main/classes/automation/SuiteRunner/constants';
import { suiteReportOf } from '@/main/classes/automation/SuiteRunner/library';

const line = (event: object) => `${SUITE_REPORTER.prefix}${JSON.stringify(event)}`;

describe('suiteReportOf', () => {
  it('reads a line the reporter printed', () => {
    expect(suiteReportOf(line({ kind: 'step', id: 't-1', title: 'Abrir' }))).toEqual({
      kind: 'step',
      id: 't-1',
      title: 'Abrir',
    });
  });

  it('ignores a line the suite printed on its own', () => {
    expect(suiteReportOf('[dotenv@17.2.1] injecting env (3) from .env')).toBeNull();
    expect(suiteReportOf('')).toBeNull();
  });

  it('ignores a line cut in half or shaped otherwise', () => {
    expect(suiteReportOf(`${SUITE_REPORTER.prefix}{"kind":"begin","tot`)).toBeNull();
    expect(suiteReportOf(line({ kind: 'begin', total: 'three' }))).toBeNull();
    expect(suiteReportOf(line({ kind: 'reboot' }))).toBeNull();
  });

  it('reads a test that ended with the status Playwright gave it, and nothing else', () => {
    const ended = {
      kind: 'test-end',
      id: 't-1',
      title: 'x',
      file: '/a.spec.ts',
      line: 1,
      project: '',
      outcome: 'expected',
      retry: 0,
      durationMs: 5,
      error: null,
      attachments: [],
    };

    expect(suiteReportOf(line({ ...ended, status: 'timedOut' }))).not.toBeNull();
    expect(suiteReportOf(line({ ...ended, status: 'exploded' }))).toBeNull();
  });
});
