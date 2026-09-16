import { describe, expect, it } from 'vitest';
import { lastWritten } from '@/hooks/useArchive/library';

describe('lastWritten', () => {
  it('anything disk has never seen is new', () => {
    expect(lastWritten().isNew('w1', '{}')).toBe(true);
  });

  it('what was just read back is not written over it again', () => {
    const held = lastWritten();

    held.keep('w1', '{"name":"Cart"}');

    expect(held.isNew('w1', '{"name":"Cart"}')).toBe(false);
  });

  it('a real change is new again', () => {
    const held = lastWritten();

    held.keep('w1', '{"name":"Cart"}');

    expect(held.isNew('w1', '{"name":"Checkout"}')).toBe(true);
  });

  it('two workspaces do not stand in for each other', () => {
    const held = lastWritten();

    held.keep('w1', '{}');

    expect(held.isNew('w2', '{}')).toBe(true);
  });

  it('a workspace that comes back after being removed is written again', () => {
    const held = lastWritten();

    held.keep('w1', '{}');
    held.forget('w1');

    expect(held.isNew('w1', '{}')).toBe(true);
  });
});
