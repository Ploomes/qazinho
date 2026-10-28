import { describe, expect, it } from 'vitest';
import { adfToMarkdown } from '@/main/classes/integrations/JiraApi/library';

const doc = (...content: unknown[]) => ({ type: 'doc', version: 1, content });
const text = (value: string, marks?: unknown[]) => ({ type: 'text', text: value, marks });
const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content });

describe('adfToMarkdown', () => {
  it('keeps paragraphs and headings, with what the text is marked as', () => {
    expect(
      adfToMarkdown(
        doc(
          { type: 'heading', attrs: { level: 2 }, content: [text('Cupom')] },
          paragraph(
            text('Aplicar '),
            text('SAVE10', [{ type: 'code' }]),
            text(' dá '),
            text('10%', [{ type: 'strong' }]),
            text(' de desconto, '),
            text('veja o protótipo', [
              { type: 'link', attrs: { href: 'https://figma.com/x' } },
            ]),
          ),
        ),
      ),
    ).toBe(
      '## Cupom\n\nAplicar `SAVE10` dá **10%** de desconto, [veja o protótipo](https://figma.com/x)',
    );
  });

  /**
   * Os critérios de aceitação costumam vir como checklist ou lista numerada, às vezes
   * aninhadas.
   */
  it('keeps lists, numbered lists and checklists, nested ones under their item', () => {
    expect(
      adfToMarkdown(
        doc(
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  paragraph(text('Cupom válido')),
                  {
                    type: 'orderedList',
                    attrs: { order: 3 },
                    content: [
                      { type: 'listItem', content: [paragraph(text('dá desconto'))] },
                      { type: 'listItem', content: [paragraph(text('mostra o total'))] },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { state: 'DONE' },
                content: [text('Expirado recusa')],
              },
              {
                type: 'taskItem',
                attrs: { state: 'TODO' },
                content: [text('Um por pedido')],
              },
            ],
          },
        ),
      ),
    ).toBe(
      '- Cupom válido\n  3. dá desconto\n  4. mostra o total\n\n- [x] Expirado recusa\n- [ ] Um por pedido',
    );
  });

  it('turns a table into a markdown table, its pipes kept as text', () => {
    const cell = (type: string, value: string) => ({
      type,
      content: [paragraph(text(value))],
    });

    expect(
      adfToMarkdown(
        doc({
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [cell('tableHeader', 'Plano'), cell('tableHeader', 'Preço')],
            },
            {
              type: 'tableRow',
              content: [cell('tableCell', 'Premium'), cell('tableCell', 'R$ 10 | mês')],
            },
          ],
        }),
      ),
    ).toBe('| Plano | Preço |\n| --- | --- |\n| Premium | R$ 10 \\| mês |');
  });

  it('keeps code, quotes, rules, mentions, emoji, cards, dates and images as text', () => {
    expect(
      adfToMarkdown(
        doc(
          {
            type: 'codeBlock',
            attrs: { language: 'json' },
            content: [text('{"ok":true}')],
          },
          {
            type: 'panel',
            attrs: { panelType: 'info' },
            content: [paragraph(text('Só no app'))],
          },
          { type: 'rule' },
          paragraph(
            { type: 'mention', attrs: { text: '@Ana' } },
            text(' '),
            { type: 'emoji', attrs: { shortName: ':smile:', text: '😄' } },
            text(' '),
            { type: 'inlineCard', attrs: { url: 'https://jira.test/browse/SHOP-1' } },
            text(' até '),
            { type: 'date', attrs: { timestamp: '1792627200000' } },
            { type: 'hardBreak' },
            { type: 'status', attrs: { text: 'EM ANDAMENTO' } },
          ),
          {
            type: 'mediaSingle',
            content: [{ type: 'media', attrs: { alt: 'checkout.png' } }],
          },
        ),
      ),
    ).toBe(
      '```json\n{"ok":true}\n```\n\n> Só no app\n\n---\n\n@Ana 😄 https://jira.test/browse/SHOP-1 até 2026-10-22\nEM ANDAMENTO\n\n[checkout.png]',
    );
  });

  it('reads a plain string as it is, and nothing from what is not a document', () => {
    expect(adfToMarkdown('  Dado que o cupom vale  ')).toBe('Dado que o cupom vale');
    expect(adfToMarkdown(null)).toBe('');
    expect(adfToMarkdown(7)).toBe('');
  });

  it('still reads the text of a node it does not know', () => {
    expect(
      adfToMarkdown(
        doc({ type: 'bodiedExtension', content: [paragraph(text('Macro'))] }),
      ),
    ).toBe('Macro');
  });
});
