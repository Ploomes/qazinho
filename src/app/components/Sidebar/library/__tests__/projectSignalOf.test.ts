import { describe, expect, it } from 'vitest';
import { projectSignalOf } from '@/app/components/Sidebar/library';

describe('projectSignalOf', () => {
  it('puts a question above a run, a run above a pause, a pause above a failure', () => {
    expect(projectSignalOf(['failed', 'running', 'asking'])).toBe('asking');
    expect(projectSignalOf(['failed', 'paused', 'running'])).toBe('running');
    expect(projectSignalOf(['failed', 'paused'])).toBe('paused');
    expect(projectSignalOf([null, 'failed'])).toBe('failed');
  });

  it('shows nothing on a project whose plans need nothing, or that has none', () => {
    expect(projectSignalOf([null, null])).toBeNull();
    expect(projectSignalOf([])).toBeNull();
  });
});
