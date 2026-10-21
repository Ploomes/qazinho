import { describe, expect, it } from 'vitest';
import { isConfirmCall } from '@/modules/Assistant/library';

describe('isConfirmCall', () => {
  it('holds deleting and disconnecting for the QA', () => {
    expect(isConfirmCall({ name: 'delete_project', args: { project: 'p1' } })).toBe(true);
    expect(
      isConfirmCall({ name: 'disconnect_integration', args: { integration: 'jira' } }),
    ).toBe(true);
  });

  it('does NOT hold what can be undone by hand', () => {
    expect(
      isConfirmCall({ name: 'rename_workspace', args: { workspace: 'w1', name: 'x' } }),
    ).toBe(false);
    expect(
      isConfirmCall({ name: 'connect_integration', args: { integration: 'jira' } }),
    ).toBe(false);
  });
});
