import { describe, expect, it } from 'vitest';
import { htmlUrlOf } from '@/main/classes/integrations/BugFiler/library';

describe('htmlUrlOf', () => {
  it('reads the page of what GitHub made, such as a comment', () => {
    expect(
      htmlUrlOf(
        '{"id":7,"html_url":"https://github.com/acme/shop/issues/42#issuecomment-7"}',
      ),
    ).toBe('https://github.com/acme/shop/issues/42#issuecomment-7');
  });

  it('reads nothing out of an answer with no page', () => {
    expect(htmlUrlOf('{"message":"Not Found"}')).toBeNull();
    expect(htmlUrlOf('oops')).toBeNull();
  });
});
