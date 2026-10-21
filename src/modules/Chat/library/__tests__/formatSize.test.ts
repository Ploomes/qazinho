import { describe, expect, it } from 'vitest';
import { formatSize } from '@/modules/Chat/library';

describe('formatSize', () => {
  it('says a download in megabytes with one decimal, in the language the QA reads', () => {
    expect(formatSize({ bytes: 3.25 * 1024 * 1024, language: 'en' })).toBe('3.3 MB');
    expect(formatSize({ bytes: 3.25 * 1024 * 1024, language: 'pt' })).toBe('3,3 MB');
  });

  it('says a download under a megabyte in whole kilobytes', () => {
    expect(formatSize({ bytes: 315 * 1024, language: 'en' })).toBe('315 kB');
  });
});
