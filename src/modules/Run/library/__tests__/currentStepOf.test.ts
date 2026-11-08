import { describe, expect, it } from 'vitest';
import { currentStepOf } from '@/modules/Run/library';

describe('the step a run is on', () => {
  it('is the first one before anything was walked', () => {
    expect(currentStepOf({ walked: 0, total: 3 })).toBe(1);
  });

  it('is the one after those already walked', () => {
    expect(currentStepOf({ walked: 1, total: 3 })).toBe(2);
  });

  it('never goes past the last', () => {
    expect(currentStepOf({ walked: 3, total: 3 })).toBe(3);
  });

  it('has none in a plan with no steps', () => {
    expect(currentStepOf({ walked: 0, total: 0 })).toBe(0);
  });
});
