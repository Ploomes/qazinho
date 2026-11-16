import { describe, expect, it } from 'vitest';
import { compareVersions } from '@/modules/Help/library';

describe('compareVersions', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareVersions('0.17.0', '0.18.0')).toBeLessThan(0);
    expect(compareVersions('1.0.0', '0.99.9')).toBeGreaterThan(0);
    expect(compareVersions('0.17.2', '0.17.10')).toBeLessThan(0);
  });

  it('counts a version as itself', () => {
    expect(compareVersions('0.17.0', '0.17.0')).toBe(0);
  });

  it('reads a prerelease by its numbers and a missing part as zero', () => {
    expect(compareVersions('0.18.0-beta.1', '0.18.0')).toBe(0);
    expect(compareVersions('0.18', '0.18.0')).toBe(0);
  });
});
