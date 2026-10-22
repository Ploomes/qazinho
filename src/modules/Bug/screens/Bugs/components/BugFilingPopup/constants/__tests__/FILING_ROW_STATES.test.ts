import { describe, expect, it } from 'vitest';
import { FILING_ROW_STATES } from '@/modules/Bug/screens/Bugs/components/BugFilingPopup/constants';

describe('FILING_ROW_STATES', () => {
  it('draws the step main is taking as the one under way, and every other as it stands', () => {
    expect(FILING_ROW_STATES).toEqual({
      pending: 'pending',
      working: 'active',
      done: 'done',
      failed: 'failed',
    });
  });
});
