import { describe, expect, it } from 'vitest';
import { pickedIssuesOf } from '@/main/classes/integrations/JiraApi/library';

const SITE = 'https://acme.atlassian.net';

describe('pickedIssuesOf', () => {
  it('lists the issues of every section once, in the order Jira suggests them', () => {
    expect(
      pickedIssuesOf({
        site: SITE,
        answer: {
          sections: [
            {
              id: 'hs',
              label: 'History Search',
              issues: [
                {
                  key: 'SHOP-12',
                  summaryText: 'Aplicar cupom',
                  summary: 'Aplicar <b>cupom</b>',
                },
              ],
            },
            {
              id: 'cs',
              label: 'Current Search',
              issues: [
                { key: 'SHOP-12', summaryText: 'Aplicar cupom' },
                { key: 'SHOP-14', summary: 'Frete <b>grátis</b>' },
              ],
            },
          ],
        },
      }),
    ).toEqual([
      { key: 'SHOP-12', summary: 'Aplicar cupom', url: `${SITE}/browse/SHOP-12` },
      { key: 'SHOP-14', summary: 'Frete grátis', url: `${SITE}/browse/SHOP-14` },
    ]);
  });

  it('finds nothing in an answer that is not the picker', () => {
    expect(pickedIssuesOf({ site: SITE, answer: { errorMessages: ['x'] } })).toEqual([]);
    expect(pickedIssuesOf({ site: SITE, answer: null })).toEqual([]);
    expect(
      pickedIssuesOf({
        site: SITE,
        answer: { sections: [{ issues: [{ summary: 'no key' }] }] },
      }),
    ).toEqual([]);
  });
});
