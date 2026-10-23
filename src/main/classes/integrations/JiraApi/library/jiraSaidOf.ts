/** What Jira or Confluence said when it refused a request, in one line: its messages, then what was wrong with each field or each error it listed. */
export function jiraSaidOf(body: unknown): string {
  const { errorMessages, errors, message } = (body ?? {}) as {
    errorMessages?: unknown;
    errors?: unknown;
    message?: unknown;
  };
  const messages: unknown[] = [
    ...(Array.isArray(errorMessages) ? (errorMessages as unknown[]) : []),
    ...(typeof message === 'string' ? [message] : []),
  ];
  const listed: unknown[] = Array.isArray(errors) ? (errors as unknown[]) : [];
  const fields: unknown[] =
    listed.length > 0
      ? listed.flatMap((one): unknown[] => {
          const { title, detail } = (one ?? {}) as { title?: unknown; detail?: unknown };

          return [title, detail];
        })
      : errors !== null && typeof errors === 'object'
        ? Object.values(errors as Record<string, unknown>)
        : [];

  return [...messages, ...fields]
    .filter((said): said is string => typeof said === 'string')
    .map((said) => said.trim())
    .filter((said) => said !== '')
    .join(' ');
}
