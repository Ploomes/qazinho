const URL_IN_TEXT = /https:\/\/\S+/g;

/** The address an agent CLI printed for the QA to sign in at, or null while it has not printed one. */
export function authorizeUrlIn(printed: string): string | null {
  return (
    (printed.match(URL_IN_TEXT) ?? []).find((url) => /oauth|authorize/i.test(url)) ?? null
  );
}
