import { describe, expect, it } from 'vitest';
import { jiraIssueOf } from '@/main/classes/integrations/JiraApi/library';

const SITE = 'https://acme.atlassian.net';
const doc = (said: string) => ({
  type: 'doc',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: said }] }],
});

describe('jiraIssueOf', () => {
  it('reads the issue as the team left it: description, status and comments', () => {
    expect(
      jiraIssueOf({
        site: SITE,
        issue: {
          key: 'SHOP-57',
          fields: {
            summary: 'Expired coupon taken',
            description: doc('The total drops.'),
            status: { name: 'Em revisão', statusCategory: { key: 'indeterminate' } },
            comment: {
              comments: [
                {
                  author: { displayName: 'Bia Dev' },
                  created: '2026-10-22T10:00:00.000-0300',
                  body: doc('Acontece no mobile?'),
                },
              ],
            },
          },
        },
      }),
    ).toEqual({
      key: 'SHOP-57',
      title: 'Expired coupon taken',
      url: `${SITE}/browse/SHOP-57`,
      status: 'Em revisão',
      isClosed: false,
      body: 'The total drops.',
      comments: [{ author: 'Bia Dev', at: '2026-10-22', text: 'Acontece no mobile?' }],
    });
  });

  it('reads an issue the team marked done as closed, whatever its status is called', () => {
    expect(
      jiraIssueOf({
        site: SITE,
        issue: {
          key: 'SHOP-57',
          fields: { status: { name: 'Concluído', statusCategory: { key: 'done' } } },
        },
      }),
    ).toMatchObject({ isClosed: true, body: '', comments: [] });
  });

  it('reads nothing out of an answer that is no issue', () => {
    expect(jiraIssueOf({ site: SITE, issue: { errorMessages: [] } })).toBeNull();
  });
});
