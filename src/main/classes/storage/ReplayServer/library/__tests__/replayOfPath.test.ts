import { describe, expect, it } from 'vitest';
import { replayOfPath } from '@/main/classes/storage/ReplayServer/library';

describe('replayOfPath', () => {
  it('reads the workspace and the run out of a path carrying this launch token', () => {
    expect(replayOfPath({ path: '/t0k/w%201/r-01', token: 't0k' })).toEqual({
      workspaceId: 'w 1',
      runId: 'r-01',
    });
  });

  it('ignores a query the <video> may add', () => {
    expect(replayOfPath({ path: '/t0k/w1/r-01?seek=1', token: 't0k' })?.runId).toBe(
      'r-01',
    );
  });

  it('does NOT answer a path with another token', () => {
    expect(replayOfPath({ path: '/guess/w1/r-01', token: 't0k' })).toBeNull();
  });

  /** The two names become folders under the archive: an escaped slash or a dot would climb out of it. */
  it('refuses a name that would climb out of the run folders', () => {
    expect(replayOfPath({ path: '/t0k/..%2F..%2Fetc/r-01', token: 't0k' })).toBeNull();
    expect(replayOfPath({ path: '/t0k/w1/..', token: 't0k' })).toBeNull();
    expect(replayOfPath({ path: '/t0k/w1/%5Csecret', token: 't0k' })).toBeNull();
  });

  it('refuses a path with a part missing, extra segments or broken escapes', () => {
    expect(replayOfPath({ path: '/t0k/w1', token: 't0k' })).toBeNull();
    expect(replayOfPath({ path: '/t0k/w1/r-01/more', token: 't0k' })).toBeNull();
    expect(replayOfPath({ path: '/t0k/w1/%E0%A4%A', token: 't0k' })).toBeNull();
  });
});
