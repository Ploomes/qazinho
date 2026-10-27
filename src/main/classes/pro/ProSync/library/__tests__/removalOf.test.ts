import { describe, expect, it } from 'vitest';
import { removalOf } from '@/main/classes/pro/ProSync/library';

describe('removalOf', () => {
  it('counts a project deleted, or one the org no longer had, as removed', () => {
    expect(removalOf({ isOk: true })).toEqual({ isRemoved: true });
    expect(removalOf({ isOk: false, status: 404, error: 'project_not_found' })).toEqual({
      isRemoved: true,
    });
  });

  it('names a CI job still going, a role that may not, and no answer apart', () => {
    expect(removalOf({ isOk: false, status: 409, error: 'project_busy' })).toEqual({
      isRemoved: false,
      failure: 'busy',
    });
    expect(removalOf({ isOk: false, status: 403, error: 'forbidden' })).toEqual({
      isRemoved: false,
      failure: 'forbidden',
    });
    expect(removalOf({ isOk: false, status: 0, error: 'unreachable' })).toEqual({
      isRemoved: false,
      failure: 'unreachable',
    });
    expect(removalOf({ isOk: false, status: 401, error: 'unauthorized' })).toEqual({
      isRemoved: false,
      failure: 'signed-out',
    });
  });

  it('does NOT count an org it cannot reach as a deletion', () => {
    expect(removalOf({ isOk: false, status: 404, error: 'org_not_found' })).toEqual({
      isRemoved: false,
      failure: 'failed',
    });
  });
});
