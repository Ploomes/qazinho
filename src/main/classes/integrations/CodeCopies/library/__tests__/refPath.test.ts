import { describe, expect, it } from 'vitest';
import { refPath } from '@/main/classes/integrations/CodeCopies/library';

describe('refPath', () => {
  it('keeps the slashes of a branch, and escapes what a path cannot hold', () => {
    expect(refPath('feat/cupom')).toBe('feat/cupom');
    expect(refPath('fix/frete#2 urgente')).toBe('fix/frete%232%20urgente');
  });

  it('leaves a plain branch as it is', () => {
    expect(refPath('main')).toBe('main');
  });
});
