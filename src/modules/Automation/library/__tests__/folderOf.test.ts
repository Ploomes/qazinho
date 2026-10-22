import { describe, expect, it } from 'vitest';
import { folderOf } from '@/modules/Automation/library';

describe('folderOf', () => {
  it('reads the folder a spec file sits in', () => {
    expect(folderOf('tests/hc-1139/ct-nav.spec.ts')).toBe('tests/hc-1139');
  });

  it('reads a file at the root of the suite as in no folder', () => {
    expect(folderOf('login.spec.ts')).toBe('');
  });
});
