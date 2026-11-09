import { describe, expect, it } from 'vitest';
import { isMemoryRefusal } from '@/main/classes/pro/ProSync/library';

describe('isMemoryRefusal', () => {
  it('is about the memories when the org refused them for the limit', () => {
    expect(isMemoryRefusal({ status: 409, error: 'memory_limit' })).toBe(true);
  });

  it('is about the memories when the body itself did not read', () => {
    expect(isMemoryRefusal({ status: 400, error: 'validation_error' })).toBe(true);
  });

  it('is about the memories when the API does not know the route yet', () => {
    expect(isMemoryRefusal({ status: 404, error: 'not_found' })).toBe(true);
  });

  it('is about the whole project when the project itself is gone', () => {
    expect(isMemoryRefusal({ status: 404, error: 'project_not_found' })).toBe(false);
  });

  it('is about the whole project when the session or the org refused', () => {
    expect(isMemoryRefusal({ status: 401, error: 'unauthorized' })).toBe(false);
    expect(isMemoryRefusal({ status: 402, error: 'org_blocked' })).toBe(false);
    expect(isMemoryRefusal({ status: 500, error: 'internal' })).toBe(false);
  });
});
