import { describe, expect, it } from 'vitest';
import { failureNotesOf } from '@/main/classes/automation/SuiteChanges/library';

const CONTEXT = `# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.

# Test info

- Name: hc-1139/ct-nav.spec.ts >> CT-NAV-001

# Error details

\`\`\`
Error: locator.click: strict mode violation
\`\`\`

# Page snapshot

\`\`\`yaml
- link "Produtos" [ref=e5]
- link "Ver produtos" [ref=e12]
\`\`\`

# Test source

\`\`\`ts
> 7  |       await page.getByRole('link', { name: 'Produtos' }).click();
\`\`\`
`;

describe('failureNotesOf', () => {
  it('keeps the page as it was and the test source', () => {
    expect(failureNotesOf(CONTEXT)).toBe(
      [
        '# Page snapshot',
        '',
        '```yaml',
        '- link "Produtos" [ref=e5]',
        '- link "Ver produtos" [ref=e12]',
        '```',
        '',
        '# Test source',
        '',
        '```ts',
        "> 7  |       await page.getByRole('link', { name: 'Produtos' }).click();",
        '```',
      ].join('\n'),
    );
  });

  /** Playwright writes those for a model of its own; the agent gets QAzinho's brief instead, and the error apart. */
  it('drops the instructions Playwright writes for a model, and what QAzinho tells apart', () => {
    const notes = failureNotesOf(CONTEXT);

    expect(notes).not.toContain('Instructions');
    expect(notes).not.toContain('Explain why');
    expect(notes).not.toContain('Error details');
  });

  it('keeps nothing of notes with neither section', () => {
    expect(failureNotesOf('# Instructions\n\n- Do this.\n')).toBe('');
    expect(failureNotesOf('')).toBe('');
  });
});
