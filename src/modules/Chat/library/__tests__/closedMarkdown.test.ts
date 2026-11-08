import { describe, expect, it } from 'vitest';
import { closedMarkdown } from '@/modules/Chat/library';

describe('markdown still arriving', () => {
  it('leaves finished text alone', () => {
    expect(closedMarkdown('um **dois** `três`')).toBe('um **dois** `três`');
  });

  it('closes a bold that is still open, so it shows as bold from the start', () => {
    expect(closedMarkdown('um **dois')).toBe('um **dois**');
  });

  it('does not show the marker of a bold that has only just opened', () => {
    expect(closedMarkdown('um **')).toBe('um ');
  });

  it('closes inline code', () => {
    expect(closedMarkdown('rode `npm')).toBe('rode `npm`');
  });

  it('closes a code block, leaving what is inside it as it is', () => {
    expect(closedMarkdown('veja\n```\nconst a = **b')).toBe(
      'veja\n```\nconst a = **b\n```',
    );
  });

  it('counts no marker that sits inside code', () => {
    expect(closedMarkdown('`a ** b` e fim')).toBe('`a ** b` e fim');
  });
});
