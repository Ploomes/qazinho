// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { scrollParentOf } from '@/shared/hooks/useToTop/library';

describe('scrollParentOf', () => {
  it('finds the nearest ancestor that scrolls, past the ones that do not', () => {
    const scroller = document.createElement('div');
    const plain = document.createElement('div');
    const top = document.createElement('div');

    scroller.style.overflowY = 'auto';
    scroller.append(plain);
    plain.append(top);

    expect(scrollParentOf(top)).toBe(scroller);
  });

  it('counts an ancestor that always scrolls', () => {
    const scroller = document.createElement('div');
    const top = document.createElement('div');

    scroller.style.overflowY = 'scroll';
    scroller.append(top);

    expect(scrollParentOf(top)).toBe(scroller);
  });

  /** Um ancestral que esconde o que sobra não rola: o topo dele não é o topo da lista. */
  it('finds nothing when no ancestor scrolls', () => {
    const hidden = document.createElement('div');
    const top = document.createElement('div');

    hidden.style.overflowY = 'hidden';
    hidden.append(top);

    expect(scrollParentOf(top)).toBeNull();
  });
});
