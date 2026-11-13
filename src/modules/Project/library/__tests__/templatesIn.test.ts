import { describe, expect, it } from 'vitest';
import { templatesIn } from '@/modules/Project/library';

describe('templatesIn', () => {
  it('keeps the template the project chose for each kind', () => {
    expect(templatesIn({ bug: 't-1', plan: 'qazinho' })).toEqual({
      bug: 't-1',
      plan: 'qazinho',
    });
  });

  it('drops a kind it does not know or an empty choice, and reads none as null', () => {
    expect(templatesIn({ poem: 't-1', bug: '' })).toBeNull();
    expect(templatesIn('t-1')).toBeNull();
  });
});
