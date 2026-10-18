import { describe, expect, it } from 'vitest';
import { gaugeTone } from '@/shared/components/atoms/Gauge/library';

describe('gaugeTone', () => {
  it('reads easy while more than a quarter is left', () => {
    expect(gaugeTone(0.26)).toBe('easy');
    expect(gaugeTone(1)).toBe('easy');
  });

  it('turns tight at a quarter left, and empty at a tenth', () => {
    expect(gaugeTone(0.25)).toBe('tight');
    expect(gaugeTone(0.11)).toBe('tight');
    expect(gaugeTone(0.1)).toBe('empty');
    expect(gaugeTone(0)).toBe('empty');
  });
});
