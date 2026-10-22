const BUG = /^(bug|defect|defeito|erro)$/i;
const TASK = /^(task|tarefa)$/i;

/** The issue type a bug is filed as in a project, by its id: the project's Bug, else its Task, else its first type that is not a subtask; null when Jira listed none. */
export function bugTypeOf(body: unknown): string | null {
  const answer = (body ?? {}) as { issueTypes?: unknown; values?: unknown };
  const listed = Array.isArray(answer.issueTypes)
    ? answer.issueTypes
    : Array.isArray(answer.values)
      ? answer.values
      : [];
  const types = listed.flatMap((type) => {
    const { id, name, untranslatedName, subtask } = (type ?? {}) as Record<
      string,
      unknown
    >;

    return typeof id === 'string' && subtask !== true
      ? [
          {
            id,
            names: [name, untranslatedName].filter(
              (one): one is string => typeof one === 'string',
            ),
          },
        ]
      : [];
  });
  const named = (pattern: RegExp) =>
    types.find(({ names }) => names.some((one) => pattern.test(one.trim())));

  return (named(BUG) ?? named(TASK) ?? types[0])?.id ?? null;
}
