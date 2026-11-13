import { describe, expect, it } from 'vitest';
import { boardColumnsOf } from '@/main/classes/integrations/JiraApi/library';

describe('boardColumnsOf', () => {
  it('names the statuses that fall in each column of the board', () => {
    expect(
      boardColumnsOf({
        config: {
          columnConfig: {
            columns: [
              { name: 'Ready for QA', statuses: [{ id: '10' }, { id: 11 }] },
              { name: 'Done', statuses: [{ id: '3' }] },
            ],
          },
        },
        statuses: [
          { id: '10', name: 'Ready for QA' },
          { id: '11', name: 'In QA' },
          { id: '3', name: 'Done' },
        ],
      }),
    ).toEqual([
      { name: 'Ready for QA', statuses: ['Ready for QA', 'In QA'] },
      { name: 'Done', statuses: ['Done'] },
    ]);
  });

  it('keeps a column whose statuses the site no longer lists, with none', () => {
    expect(
      boardColumnsOf({
        config: {
          columnConfig: { columns: [{ name: 'Old', statuses: [{ id: '99' }] }] },
        },
        statuses: [],
      }),
    ).toEqual([{ name: 'Old', statuses: [] }]);
  });

  it('reads nothing from a configuration that has no columns', () => {
    expect(boardColumnsOf({ config: {}, statuses: [] })).toEqual([]);
  });
});
