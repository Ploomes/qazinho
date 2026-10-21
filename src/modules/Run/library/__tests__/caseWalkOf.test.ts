import { describe, expect, it } from 'vitest';
import { caseWalkOf } from '@/modules/Run/library';

describe('caseWalkOf', () => {
  it('reads a case walked again without the agent from every one of its steps', () => {
    expect(caseWalkOf([{ by: 'replay' }, { by: 'replay' }])).toBe('replay');
  });

  it('reads a case the agent healed as healed, whatever its other steps say', () => {
    expect(caseWalkOf([{ by: 'healed' }, {}])).toBe('healed');
  });

  it("does NOT call an agent's own walk anything, nor a case with no step", () => {
    expect(caseWalkOf([{}, { by: 'replay' }])).toBeNull();
    expect(caseWalkOf([])).toBeNull();
  });
});
