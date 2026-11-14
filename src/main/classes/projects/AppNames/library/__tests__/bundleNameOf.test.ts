import { describe, expect, it } from 'vitest';
import { bundleNameOf } from '@/main/classes/projects/AppNames/library';

describe('bundleNameOf', () => {
  it('reads the name plutil printed', () => {
    expect(bundleNameOf('Loja\n')).toBe('Loja');
  });

  it('reads nothing from an empty answer or a build variable left unresolved', () => {
    expect(bundleNameOf('')).toBeNull();
    expect(bundleNameOf('$(PRODUCT_NAME)')).toBeNull();
  });
});
