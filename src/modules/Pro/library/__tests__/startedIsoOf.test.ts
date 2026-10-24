import { describe, expect, it } from 'vitest';
import { startedIsoOf } from '@/modules/Pro/library';
import { RECORDING } from '@/modules/Workspace/library/__tests__/fixtures';

describe('startedIsoOf', () => {
  it('reads the moment the run kept', () => {
    expect(
      startedIsoOf({ startedAtMs: Date.UTC(2026, 9, 24, 9, 41), video: RECORDING }),
    ).toBe('2026-10-24T09:41:00.000Z');
  });

  it('falls back to when its recording began, for a run older than that moment', () => {
    expect(startedIsoOf({ video: RECORDING })).toBe(
      new Date(RECORDING.startedAt).toISOString(),
    );
  });

  it('knows nothing of a run with neither', () => {
    expect(startedIsoOf({ video: null })).toBeNull();
  });
});
