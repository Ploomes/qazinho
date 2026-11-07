import { describe, expect, it } from 'vitest';
import { isOutsideChange } from '@/modules/Outside/library';

describe('isOutsideChange', () => {
  it('takes what changes or deletes what the QA keeps', () => {
    expect(
      isOutsideChange({
        name: 'delete_cases',
        args: { workspace: 'w', cases: ['TC-01'] },
      }),
    ).toBe(true);
    expect(isOutsideChange({ name: 'delete_project', args: { project: 'Loja' } })).toBe(
      true,
    );
  });

  it('does NOT take what only reads or runs', () => {
    expect(isOutsideChange({ name: 'list_workspaces', args: {} })).toBe(false);
    expect(isOutsideChange({ name: 'run_status', args: { workspace: 'w' } })).toBe(false);
  });
});
