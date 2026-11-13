import { describe, expect, it } from 'vitest';
import { shaOfBranch } from '@/main/classes/integrations/SourceCheck/library';

describe('shaOfBranch', () => {
  it('reads the commit a branch is at', () => {
    expect(shaOfBranch(JSON.stringify({ name: 'main', commit: { sha: 'abc123' } }))).toBe(
      'abc123',
    );
  });

  it('reads nothing from an answer that is not about a branch', () => {
    expect(shaOfBranch('{"message":"Not Found"}')).toBeNull();
    expect(shaOfBranch('not json')).toBeNull();
  });
});
