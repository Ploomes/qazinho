import { describe, expect, it } from 'vitest';
import { viewportOf } from '@/modules/Device/library';

describe('viewportOf', () => {
  it('gives the size a workspace keeps', () => {
    expect(viewportOf('phone')).toMatchObject({ width: 390, height: 844 });
  });

  it('falls back to the desktop size for a workspace saved before sizes, or a name it does not know', () => {
    expect(viewportOf(undefined).id).toBe('desktop');
    expect(viewportOf('watch').id).toBe('desktop');
  });
});
