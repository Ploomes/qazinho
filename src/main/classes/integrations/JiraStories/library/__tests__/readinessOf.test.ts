import { describe, expect, it } from 'vitest';
import { readinessOf } from '@/main/classes/integrations/JiraStories/library';

describe('readinessOf', () => {
  it('says a story in a status the project counts has arrived for testing', () => {
    expect(
      readinessOf({ status: 'Ready for QA', ready: ['ready for qa ', 'In QA'] }),
    ).toBe('ready');
  });

  /** O plano sai antes do app: a história ainda está sendo feita. */
  it('says a story in any other status is still ahead of the app', () => {
    expect(readinessOf({ status: 'In Progress', ready: ['Ready for QA'] })).toBe('ahead');
  });

  it('says nothing when the project named no status', () => {
    expect(readinessOf({ status: 'In Progress', ready: [] })).toBeNull();
  });
});
