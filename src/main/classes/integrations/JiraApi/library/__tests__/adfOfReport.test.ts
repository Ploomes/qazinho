import { describe, expect, it } from 'vitest';
import { adfOfReport } from '@/main/classes/integrations/JiraApi/library';

describe('adfOfReport', () => {
  it('writes each block the way Jira draws it', () => {
    expect(
      adfOfReport({
        title: 'Coupon refused',
        blocks: [
          { kind: 'heading', text: 'Steps to reproduce' },
          {
            kind: 'steps',
            items: [
              { text: 'Open the cart', isBad: false },
              { text: 'Apply SAVE10', isBad: true },
            ],
          },
          { kind: 'paragraph', text: 'First line\nSecond line' },
          {
            kind: 'facts',
            items: [
              { label: 'Run', value: 'r-03', url: null },
              {
                label: 'Story',
                value: 'SHOP-12',
                url: 'https://acme.atlassian.net/browse/SHOP-12',
              },
            ],
          },
          { kind: 'requests', items: [{ call: 'POST /api/coupon', outcome: '→ 500' }] },
        ],
      }).content,
    ).toEqual([
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Steps to reproduce' }],
      },
      {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Open the cart' }] },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Apply SAVE10', marks: [{ type: 'strong' }] },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'First line' },
          { type: 'hardBreak' },
          { type: 'text', text: 'Second line' },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Run: ', marks: [{ type: 'strong' }] },
                  { type: 'text', text: 'r-03' },
                ],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Story: ', marks: [{ type: 'strong' }] },
                  {
                    type: 'text',
                    text: 'SHOP-12',
                    marks: [
                      {
                        type: 'link',
                        attrs: { href: 'https://acme.atlassian.net/browse/SHOP-12' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'POST /api/coupon', marks: [{ type: 'code' }] },
                  { type: 'text', text: ' → 500' },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('leaves out what is empty: Jira refuses a document with an empty text', () => {
    expect(
      adfOfReport({
        title: 'x',
        blocks: [
          { kind: 'heading', text: ' ' },
          { kind: 'paragraph', text: '' },
          { kind: 'steps', items: [{ text: '', isBad: true }] },
          { kind: 'facts', items: [] },
        ],
      }),
    ).toEqual({ type: 'doc', version: 1, content: [] });
  });
});
