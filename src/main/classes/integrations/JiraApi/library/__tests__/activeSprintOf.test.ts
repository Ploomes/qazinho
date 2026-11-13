import { describe, expect, it } from 'vitest';
import { activeSprintOf } from '@/main/classes/integrations/JiraApi/library';

describe('activeSprintOf', () => {
  it('takes the open sprint of a board', () => {
    expect(
      activeSprintOf({ values: [{ id: 42, name: ' Sprint 42 ', state: 'active' }] }),
    ).toEqual({ id: 42, name: 'Sprint 42' });
  });

  it('takes the one that started last when two run side by side', () => {
    expect(
      activeSprintOf({
        values: [
          {
            id: 41,
            name: 'Sprint 41',
            state: 'active',
            startDate: '2026-11-02T10:00:00Z',
          },
          {
            id: 42,
            name: 'Sprint 42',
            state: 'active',
            startDate: '2026-11-09T10:00:00Z',
          },
        ],
      })?.id,
    ).toBe(42);
  });

  it('says there is none when no sprint is open, or the answer is not a list', () => {
    expect(
      activeSprintOf({ values: [{ id: 40, name: 'Sprint 40', state: 'closed' }] }),
    ).toBeNull();
    expect(activeSprintOf({ values: [] })).toBeNull();
    expect(activeSprintOf(null)).toBeNull();
  });
});
