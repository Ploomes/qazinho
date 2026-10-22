import { describe, expect, it } from 'vitest';
import { jiraStoryOf } from '@/main/classes/integrations/JiraApi/library';

const SITE = 'https://acme.atlassian.net';

const paragraph = (value: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text: value }],
});

/** Jira's answer for GET /rest/api/3/issue/SHOP-12?fields=*all&expand=names, cut to what matters. */
const ISSUE = {
  id: '10012',
  key: 'SHOP-12',
  fields: {
    summary: 'Aplicar cupom no checkout',
    issuetype: { name: 'História' },
    status: { name: 'Em andamento' },
    priority: { name: 'High' },
    labels: ['checkout', 'cupom'],
    components: [{ name: 'Web' }],
    parent: { key: 'SHOP-1', fields: { summary: 'Checkout novo' } },
    description: {
      type: 'doc',
      version: 1,
      content: [paragraph('O cliente aplica um cupom.')],
    },
    customfield_10050: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [paragraph('SAVE10 dá 10%')] },
            { type: 'listItem', content: [paragraph('Expirado é recusado')] },
          ],
        },
      ],
    },
    customfield_10016: 5,
    customfield_10060: null,
    comment: {
      comments: [
        {
          author: { displayName: 'Ana PO' },
          created: '2026-10-20T13:02:11.000-0300',
          body: { type: 'doc', version: 1, content: [paragraph('Um cupom por pedido.')] },
        },
      ],
    },
    issuelinks: [
      {
        type: { name: 'Blocks', inward: 'is blocked by', outward: 'blocks' },
        outwardIssue: { key: 'SHOP-20', fields: { summary: 'Recibo com desconto' } },
      },
      {
        type: { name: 'Relates', inward: 'relates to', outward: 'relates to' },
        inwardIssue: { key: 'SHOP-3', fields: { summary: 'Carrinho' } },
      },
    ],
    subtasks: [{ key: 'SHOP-13', fields: { summary: 'API do cupom' } }],
    attachment: [
      { id: 10001, filename: 'checkout.png', mimeType: 'image/png', size: 48_210 },
      { id: '10002', filename: 'regras.pdf', mimeType: 'application/pdf', size: 92_000 },
    ],
  },
  names: {
    summary: 'Summary',
    customfield_10050: 'Critérios de aceite',
    customfield_10016: 'Story point estimate',
    customfield_10060: 'Acceptance criteria',
  },
};

describe('jiraStoryOf', () => {
  it('reads what the story is, where it lives and what it asks for', () => {
    expect(jiraStoryOf({ issue: ISSUE, site: SITE })).toMatchObject({
      key: 'SHOP-12',
      url: 'https://acme.atlassian.net/browse/SHOP-12',
      summary: 'Aplicar cupom no checkout',
      type: 'História',
      status: 'Em andamento',
      priority: 'High',
      labels: ['checkout', 'cupom'],
      components: ['Web'],
      parent: 'SHOP-1 · Checkout novo',
      description: 'O cliente aplica um cupom.',
    });
  });

  /** Teams keep acceptance criteria in a field of their own, named in their language. */
  it('finds the acceptance criteria in a field named for them, and skips one left empty', () => {
    expect(jiraStoryOf({ issue: ISSUE, site: SITE })?.acceptance).toEqual([
      { field: 'Critérios de aceite', text: '- SAVE10 dá 10%\n- Expirado é recusado' },
    ]);
  });

  it('keeps what the team said, the issues it links to, its subtasks and its files', () => {
    expect(jiraStoryOf({ issue: ISSUE, site: SITE })).toMatchObject({
      comments: [{ author: 'Ana PO', at: '2026-10-20', text: 'Um cupom por pedido.' }],
      links: ['blocks SHOP-20 · Recibo com desconto', 'relates to SHOP-3 · Carrinho'],
      subtasks: ['SHOP-13 · API do cupom'],
      attachments: [
        { id: '10001', filename: 'checkout.png', mimeType: 'image/png', size: 48_210 },
        {
          id: '10002',
          filename: 'regras.pdf',
          mimeType: 'application/pdf',
          size: 92_000,
        },
      ],
    });
  });

  it('reads acceptance criteria kept as a list of options', () => {
    const listed = {
      ...ISSUE,
      fields: { customfield_10070: [{ value: 'Mostra o total' }, 'Some no pedido'] },
      names: { customfield_10070: 'Acceptance Criteria' },
    };

    expect(jiraStoryOf({ issue: listed, site: SITE })?.acceptance).toEqual([
      { field: 'Acceptance Criteria', text: '- Mostra o total\n- Some no pedido' },
    ]);
  });

  it('does NOT read an answer that is not an issue', () => {
    expect(
      jiraStoryOf({ issue: { errorMessages: ['Issue does not exist'] }, site: SITE }),
    ).toBeNull();
    expect(jiraStoryOf({ issue: null, site: SITE })).toBeNull();
  });
});
