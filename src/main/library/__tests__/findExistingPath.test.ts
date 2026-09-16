import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findExistingPath } from '@/main/library';

const REAL = mkdtempSync(join(tmpdir(), 'gocrash-tool-'));

describe('findExistingPath', () => {
  it('answers with the first candidate that is really there', () => {
    expect(findExistingPath(['/nope/android', REAL])).toBe(REAL);
  });

  it('answers null when this machine has none of them', () => {
    expect(findExistingPath(['/nope/android', '/nope/xcode'])).toBeNull();
  });

  it('walks past an environment variable that was never set', () => {
    expect(findExistingPath([undefined, '', REAL])).toBe(REAL);
  });
});
