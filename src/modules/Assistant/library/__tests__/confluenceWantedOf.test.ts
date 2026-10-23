import { describe, expect, it } from 'vitest';
import { confluenceWantedOf } from '@/modules/Assistant/library';

describe('confluenceWantedOf', () => {
  it("reads a page's id and title out of its link", () => {
    expect(
      confluenceWantedOf(
        'https://acme.atlassian.net/wiki/spaces/QA/pages/98304/Checkout+cen%C3%A1rios?focusedCommentId=1',
      ),
    ).toEqual({ id: '98304', title: 'Checkout cenários' });
  });

  it('takes a link with no title in it by its id', () => {
    expect(confluenceWantedOf('https://acme.atlassian.net/wiki/pages/98304')).toEqual({
      id: '98304',
      title: '',
    });
  });

  it('takes anything else as the title the QA typed', () => {
    expect(confluenceWantedOf('  Checkout: cenários do cupom ')).toEqual({
      id: null,
      title: 'Checkout: cenários do cupom',
    });
  });
});
