import { describe, expect, it } from 'vitest';
import { lastRunSayKeyOf } from '@/modules/Device/library';

describe('lastRunSayKeyOf', () => {
  it('names the failures first when a run had both', () => {
    expect(lastRunSayKeyOf({ failed: 2, passed: 19 })).toBe('DEVICE.LAST_RUN_MIXED');
  });

  it('says only what failed when nothing passed', () => {
    expect(lastRunSayKeyOf({ failed: 3, passed: 0 })).toBe('DEVICE.LAST_RUN_FAILED_ONLY');
  });

  /** Uma run sem caso andado ainda diz que passou zero, nunca uma falha que não houve. */
  it('says only what passed when nothing failed, even nothing at all', () => {
    expect(lastRunSayKeyOf({ failed: 0, passed: 21 })).toBe(
      'DEVICE.LAST_RUN_PASSED_ONLY',
    );
    expect(lastRunSayKeyOf({ failed: 0, passed: 0 })).toBe('DEVICE.LAST_RUN_PASSED_ONLY');
  });
});
