import { describe, expect, it } from 'vitest';
import { isSameText } from '@/main/classes/integrations/SourceCheck/library';

describe('isSameText', () => {
  it('reads two texts as the same when only spaces and line breaks differ', () => {
    expect(
      isSameText({
        before: 'C3. Bloquear  depois\nde 3',
        after: ' C3. Bloquear depois de 3 ',
      }),
    ).toBe(true);
  });

  it('reads a changed word as a change', () => {
    expect(isSameText({ before: 'depois de 3', after: 'depois de 5' })).toBe(false);
  });
});
