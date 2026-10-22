const KEPT = ['page snapshot', 'test source'];

/** What Playwright noted when a test failed that helps fix it: the page as it was and the test's source, without the instructions it writes for a model. */
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
