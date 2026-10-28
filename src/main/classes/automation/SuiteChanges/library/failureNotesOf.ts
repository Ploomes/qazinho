const KEPT = ['page snapshot', 'test source'];

/**
 * O que o Playwright anotou quando um teste falhou que ajuda a consertá-lo: a página como
 * estava e o fonte do teste, sem as instruções que ele escreve para um modelo.
 */
export function failureNotesOf(markdown: string): string {
  const sections = markdown.split(/^(?=# )/m);
  const kept = sections.filter((section) =>
    KEPT.includes(
      section
        .slice(2, section.indexOf('\n') === -1 ? undefined : section.indexOf('\n'))
        .trim()
        .toLowerCase(),
    ),
  );

  return kept
    .map((section) => section.trim())
    .join('\n\n')
    .trim();
}
