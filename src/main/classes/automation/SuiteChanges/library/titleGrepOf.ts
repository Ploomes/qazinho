/** A test's title as Playwright's --grep reads it: a regular expression that matches the title itself, whatever marks it holds. */
export function titleGrepOf(title: string): string {
  return title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
