import { describe, expect, it } from 'vitest';
import { suiteFileOfPath } from '@/main/classes/storage/ReplayServer/library';

describe('suiteFileOfPath', () => {
  it('reads the project, the run and the file out of a path carrying this launch token', () => {
    expect(
      suiteFileOfPath({
        path: '/t0k/suite/p-1/s-01/output/ct-nav%20chromium/test-failed-1.png',
        token: 't0k',
      }),
    ).toEqual({
      projectId: 'p-1',
      runId: 's-01',
      file: ['output', 'ct-nav chromium', 'test-failed-1.png'],
    });
  });

  it('does NOT answer a path with another token, or another route', () => {
    expect(
      suiteFileOfPath({ path: '/guess/suite/p-1/s-01/a.png', token: 't0k' }),
    ).toBeNull();
    expect(suiteFileOfPath({ path: '/t0k/w1/r-01', token: 't0k' })).toBeNull();
  });

  /** Every part becomes a folder under the suites: an escaped slash or a dot would climb out of them. */
  it('refuses a path that would climb out of its run', () => {
    expect(
      suiteFileOfPath({ path: '/t0k/suite/p-1/s-01/../../x', token: 't0k' }),
    ).toBeNull();
    expect(
      suiteFileOfPath({ path: '/t0k/suite/p-1/s-01/%2E%2E/x', token: 't0k' }),
    ).toBeNull();
    expect(
      suiteFileOfPath({ path: '/t0k/suite/..%2Fp/s-01/a.png', token: 't0k' }),
    ).toBeNull();
  });

  it('refuses a path with no file, or a broken escape', () => {
    expect(suiteFileOfPath({ path: '/t0k/suite/p-1/s-01', token: 't0k' })).toBeNull();
    expect(
      suiteFileOfPath({ path: '/t0k/suite/p-1/s-01/%E0%A4%A', token: 't0k' }),
    ).toBeNull();
  });
});
