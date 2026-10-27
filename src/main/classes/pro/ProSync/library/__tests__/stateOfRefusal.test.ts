import { describe, expect, it } from 'vitest';
import { stateOfRefusal } from '@/main/classes/pro/ProSync/library';

describe('stateOfRefusal', () => {
  it('waits for the network when the platform did not answer or broke', () => {
    expect(stateOfRefusal({ status: 0, error: 'unreachable' })).toBe('waiting');
    expect(stateOfRefusal({ status: 503, error: 'internal_error' })).toBe('waiting');
  });

  it('names a signed-out machine, a blocked org and a reader apart', () => {
    expect(stateOfRefusal({ status: 401, error: 'unauthorized' })).toBe('signed-out');
    expect(stateOfRefusal({ status: 402, error: 'org_blocked' })).toBe('blocked');
    expect(stateOfRefusal({ status: 403, error: 'forbidden' })).toBe('read-only');
  });

  it('tells a project the org deleted from an org this person no longer reaches', () => {
    expect(stateOfRefusal({ status: 404, error: 'project_not_found' })).toBe('gone');
    expect(stateOfRefusal({ status: 404, error: 'plan_not_found' })).toBe('gone');
    expect(stateOfRefusal({ status: 404, error: 'org_not_found' })).toBe('no-access');
  });

  it('does NOT call another not-found gone, so a wrong path is not taken for a deletion', () => {
    expect(stateOfRefusal({ status: 404, error: 'run_not_found' })).toBe('failed');
  });

  it('calls any other refusal a failure, so it is not retried in a loop', () => {
    expect(stateOfRefusal({ status: 400, error: 'validation_error' })).toBe('failed');
  });
});
