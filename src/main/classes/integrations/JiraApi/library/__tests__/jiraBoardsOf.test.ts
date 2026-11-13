import { describe, expect, it } from 'vitest';
import { jiraBoardsOf } from '@/main/classes/integrations/JiraApi/library';

describe('jiraBoardsOf', () => {
  it('reads each board with the project it lives in', () => {
    expect(
      jiraBoardsOf({
        values: [
          { id: 7, name: 'Shop', location: { projectKey: 'SHOP' } },
          { id: 8, name: ' Ops ', location: { displayName: 'Operations' } },
          { id: 9, name: 'Loose' },
        ],
      }),
    ).toEqual([
      { id: 7, name: 'Shop', project: 'SHOP' },
      { id: 8, name: 'Ops', project: 'Operations' },
      { id: 9, name: 'Loose', project: '' },
    ]);
  });

  it('skips a board with no id or name, and reads nothing from what is not a list', () => {
    expect(jiraBoardsOf({ values: [{ name: 'No id' }, { id: 3, name: ' ' }] })).toEqual(
      [],
    );
    expect(jiraBoardsOf(null)).toEqual([]);
  });
});
