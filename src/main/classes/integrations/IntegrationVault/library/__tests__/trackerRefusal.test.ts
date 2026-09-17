import { describe, expect, it } from 'vitest';
import { TRACKER_ERRORS } from '@/main/classes/integrations/IntegrationVault/constants';
import { trackerRefusal } from '@/main/classes/integrations/IntegrationVault/library';

describe('trackerRefusal', () => {
  it('has no complaint about a yes', () => {
    expect(trackerRefusal({ ok: true, status: 200 })).toBeNull();
  });

  it('blames the credentials on a 401 or a 403', () => {
    expect(trackerRefusal({ ok: false, status: 401 })).toBe(TRACKER_ERRORS.unauthorized);
    expect(trackerRefusal({ ok: false, status: 403 })).toBe(TRACKER_ERRORS.unauthorized);
  });

  it('names the status of anything else', () => {
    expect(trackerRefusal({ ok: false, status: 502 })).toContain('HTTP 502');
  });

  it('calls no answer at all unreachable', () => {
    expect(trackerRefusal(null)).toBe(TRACKER_ERRORS.unreachable);
  });
});
