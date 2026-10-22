/** What Jira said when it refused a request, in one line: its messages, then what was wrong with each field. */
export function jiraSaidOf(body: unknown): string {
  const { errorMessages, errors } = (body ?? {}) as {
    errorMessages?: unknown;
    errors?: unknown;
  };
  const messages: unknown[] = Array.isArray(errorMessages) ? errorMessages : [];
  const fields: unknown[] =
    errors !== null && typeof errors === 'object' ? Object.values(errors) : [];

  return [...messages, ...fields]
    .filter((said): said is string => typeof said === 'string')
    .map((said) => said.trim())
    .filter((said) => said !== '')
    .join(' ');
}
