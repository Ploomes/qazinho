import { describe, expect, it } from 'vitest';
import { endScrollOf } from '@/shared/hooks/useFollowEnd/library';

describe('endScrollOf', () => {
  it('slides to the end when less than a screen is left', () => {
    expect(endScrollOf({ top: 700, clientHeight: 200, scrollHeight: 1000 })).toBe(
      'smooth',
    );
  });

  /** Reabrir o painel deslizava do topo até o fim, a conversa inteira passando na tela. */
  it('jumps to the end when more than a screen is left', () => {
    expect(endScrollOf({ top: 0, clientHeight: 200, scrollHeight: 1000 })).toBe(
      'instant',
    );
  });

  it('slides exactly one screen, and jumps past it', () => {
    expect(endScrollOf({ top: 600, clientHeight: 200, scrollHeight: 1000 })).toBe(
      'smooth',
    );
    expect(endScrollOf({ top: 599, clientHeight: 200, scrollHeight: 1000 })).toBe(
      'instant',
    );
  });
});
