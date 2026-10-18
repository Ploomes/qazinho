// @vitest-environment jsdom
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { describe, expect, it } from 'vitest';
import { MARKDOWN } from '@/shared/components/atoms/Markdown/constants';

const render = (text: string) =>
  renderToStaticMarkup(createElement(ReactMarkdown, { ...MARKDOWN, children: text }));

describe('MARKDOWN', () => {
  it('turns what an agent writes into paragraphs, lists and emphasis', () => {
    const html = render('Two cases.\n\n- **P1** — home\n- **P2** — menu');

    expect(html).toContain('<p>Two cases.</p>');
    expect(html).toContain('<li><strong>P1</strong> — home</li>');
  });

  it('reads GitHub tables, which an agent reaches for to compare cases', () => {
    expect(render('| case | verdict |\n| - | - |\n| TC-01 | passed |')).toContain(
      '<table>',
    );
  });

  /** The agent's text is not the app's: HTML in it is shown as text, never run. */
  it('does NOT render HTML the agent wrote', () => {
    const html = render('<img src=x onerror="alert(1)"> hi');

    expect(html).not.toContain('<img');
    expect(html).not.toContain('onerror="');
  });

  it('opens a link out of the app, in the system browser', () => {
    expect(render('[docs](https://example.com)')).toContain(
      '<a class="markdown__link" href="https://example.com" target="_blank" rel="noreferrer">docs</a>',
    );
  });
});
