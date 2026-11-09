import { describe, expect, it } from 'vitest';
import { isCompaction } from '@/main/classes/agents/AgentRunner/library';

describe('isCompaction', () => {
  it('hears the line a real Claude Code writes when it compacts', () => {
    expect(
      isCompaction({
        type: 'system',
        subtype: 'compact_boundary',
      }),
    ).toBe(true);
  });

  it('leaves out every other system line', () => {
    expect(isCompaction({ type: 'system', subtype: 'init' })).toBe(false);
  });

  it('leaves out a line of another type with the same subtype', () => {
    expect(isCompaction({ type: 'result', subtype: 'compact_boundary' })).toBe(false);
  });
});
