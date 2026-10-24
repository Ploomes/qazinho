import { describe, expect, it } from 'vitest';
import { hashOf } from '@/main/classes/pro/ProSync/library';

describe('hashOf', () => {
  it('gives the same fingerprint to the same body', () => {
    expect(hashOf({ name: 'Loja', cases: [1, 2] })).toBe(
      hashOf({ name: 'Loja', cases: [1, 2] }),
    );
  });

  it('gives another fingerprint once the body changed', () => {
    expect(hashOf({ name: 'Loja' })).not.toBe(hashOf({ name: 'Loja Online' }));
  });
});
