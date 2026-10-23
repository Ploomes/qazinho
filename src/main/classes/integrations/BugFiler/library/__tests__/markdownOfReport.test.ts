import { describe, expect, it } from 'vitest';
import { markdownOfReport } from '@/main/classes/integrations/BugFiler/library';

describe('markdownOfReport', () => {
  it('writes each block the way a GitHub issue reads it', () => {
    expect(
      markdownOfReport({
        title: 'Coupon refused',
        blocks: [
          { kind: 'paragraph', text: 'SAVE10 is refused.\nEvery time.' },
          { kind: 'heading', text: 'Steps to reproduce' },
          {
            kind: 'steps',
            items: [
              { text: 'Open the cart', isBad: false },
              { text: 'Apply SAVE10', isBad: true },
            ],
          },
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
      }),
    ).toBe(
      [
        'SAVE10 is refused.  \nEvery time.',
        '### Steps to reproduce',
        '1. Open the cart\n2. **Apply SAVE10**',
        '- **Run:** r-03\n- **Story:** [SHOP-12](https://acme.atlassian.net/browse/SHOP-12)',
        '- `POST /api/coupon` → 500',
      ].join('\n\n'),
    );
  });

  it('writes a list as dashes', () => {
    expect(
      markdownOfReport({
        title: 'x',
        blocks: [{ kind: 'list', items: ['On Android', 'At 390 × 844'] }],
      }),
    ).toBe('- On Android\n- At 390 × 844');
  });

  it('keeps a backtick inside an address as code', () => {
    expect(
      markdownOfReport({
        title: 'x',
        blocks: [{ kind: 'requests', items: [{ call: 'GET /a`b', outcome: 'failed' }] }],
      }),
    ).toBe('- ``GET /a`b`` failed');
  });

  it('writes what a failed request answered as code under it', () => {
    expect(
      markdownOfReport({
        title: 'x',
        blocks: [
          {
            kind: 'requests',
            items: [
              { call: 'POST /api/coupon', outcome: '→ 500', answer: '{"error":"down"}' },
            ],
          },
        ],
      }),
    ).toBe('- `POST /api/coupon` → 500\n  `{"error":"down"}`');
  });

  it('leaves out what is empty', () => {
    expect(
      markdownOfReport({
        title: 'x',
        blocks: [
          { kind: 'heading', text: ' ' },
          { kind: 'paragraph', text: '' },
          { kind: 'steps', items: [] },
          { kind: 'facts', items: [] },
          { kind: 'requests', items: [] },
        ],
      }),
    ).toBe('');
  });

  it('writes a table, its pipes and line breaks kept inside its cells', () => {
    expect(
      markdownOfReport({
        title: 'x',
        blocks: [{ kind: 'table', head: ['#', 'Action'], rows: [['1', 'a | b\nc']] }],
      }),
    ).toBe('| # | Action |\n| --- | --- |\n| 1 | a \\| b c |');
  });
});
