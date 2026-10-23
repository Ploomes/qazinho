import { describe, expect, it } from 'vitest';
import { pickPage } from '@/modules/Assistant/library';

const page = (id: string, title: string) => ({
  id,
  title,
  space: 'QA',
  url: `https://acme.atlassian.net/wiki/pages/${id}`,
});

const PAGES = [
  page('1', 'Checkout: cenários antigos'),
  page('2', 'Checkout: Cenários do cupom'),
];

describe('pickPage', () => {
  it('takes the page the link named, whatever its title', () => {
    expect(pickPage({ wanted: { id: '1', title: 'x' }, pages: PAGES })?.id).toBe('1');
  });

  it('takes the page titled as the QA wrote it, accents and case aside', () => {
    expect(
      pickPage({
        wanted: { id: null, title: 'checkout: cenarios do cupom' },
        pages: PAGES,
      })?.id,
    ).toBe('2');
  });

  it('takes the first page found when none is titled exactly so', () => {
    expect(pickPage({ wanted: { id: null, title: 'checkout' }, pages: PAGES })?.id).toBe(
      '1',
    );
  });

  it('answers null when the search found nothing', () => {
    expect(pickPage({ wanted: { id: null, title: 'checkout' }, pages: [] })).toBeNull();
  });
});
