import { describe, expect, it } from 'vitest';
import { trackerRefusal } from '@/main/classes/integrations/IntegrationVault/library';

describe('trackerRefusal', () => {
  it('has no complaint about a yes', () => {
    expect(trackerRefusal({ ok: true, status: 200 })).toBeNull();
  });

  it('blames the credentials on a 401 or a 403', () => {
    expect(trackerRefusal({ ok: false, status: 401 })).toEqual({
      reason: 'unauthorized',
    });
    expect(trackerRefusal({ ok: false, status: 403 })).toEqual({
      reason: 'unauthorized',
    });
  });

  it('keeps the status of anything else', () => {
    expect(trackerRefusal({ ok: false, status: 502 })).toEqual({
      reason: 'unexpected',
      status: 502,
    });
  });

  it('calls no answer at all unreachable', () => {
    expect(trackerRefusal(null)).toEqual({ reason: 'unreachable' });
  });
});
