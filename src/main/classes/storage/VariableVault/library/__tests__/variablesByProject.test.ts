import { describe, expect, it } from 'vitest';
import { variablesByProject } from '@/main/classes/storage/VariableVault/library';

describe('variablesByProject', () => {
  it('groups the variables by project, in the order they were made, with no value', () => {
    expect(
      variablesByProject([
        { projectId: 'p-1', name: 'A', description: 'first', value: 'one' },
        { projectId: 'p-2', name: 'B', description: 'second', value: 'two' },
        { projectId: 'p-1', name: 'C', description: 'third', value: 'three' },
      ]),
    ).toEqual([
      {
        projectId: 'p-1',
        variables: [
          { name: 'A', description: 'first' },
          { name: 'C', description: 'third' },
        ],
      },
      { projectId: 'p-2', variables: [{ name: 'B', description: 'second' }] },
    ]);
  });

  it('lists nothing when nothing is stored', () => {
    expect(variablesByProject([])).toEqual([]);
  });
});
