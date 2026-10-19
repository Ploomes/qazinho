/** A URL as the QA's screen shows it: a password typed into it for basic auth is left out. */
export function shownUrlOf(url: string): string {
  try {
    const parsed = new URL(url);

    if (parsed.username === '' && parsed.password === '') return url;

    parsed.username = '';
    parsed.password = '';

    return parsed.toString();
  } catch {
    return url;
  }
}
