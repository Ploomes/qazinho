import { describe, expect, it } from 'vitest';
import { versionIn } from '@/main/classes/automation/SuiteRegistry/library';

describe('versionIn', () => {
  it('reads the version a package.json says', () => {
    expect(versionIn('{"name":"@playwright/test","version":"1.64.1"}')).toBe('1.64.1');
  });

  it('has none for a package with no version, or text that is not JSON', () => {
    expect(versionIn('{"name":"x"}')).toBeNull();
    expect(versionIn('{"version":""}')).toBeNull();
    expect(versionIn('not json')).toBeNull();
    expect(versionIn('null')).toBeNull();
  });
});
