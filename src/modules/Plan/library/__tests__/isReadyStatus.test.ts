import { describe, expect, it } from 'vitest';
import { isReadyStatus } from '@/modules/Plan/library';

describe('isReadyStatus', () => {
  it('matches a status the project counts, whatever its case and spaces', () => {
    expect(isReadyStatus({ status: ' ready for QA', ready: ['Ready for QA'] })).toBe(
      true,
    );
  });

  it('does NOT match another status, or any when the project counts none', () => {
    expect(isReadyStatus({ status: 'In Progress', ready: ['Ready for QA'] })).toBe(false);
    expect(isReadyStatus({ status: 'Ready for QA', ready: [] })).toBe(false);
  });
});
