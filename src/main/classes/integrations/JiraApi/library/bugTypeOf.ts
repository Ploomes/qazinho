const BUG = /^(bug|defect|defeito|erro)$/i;
const TASK = /^(task|tarefa)$/i;

/**
 * O tipo de issue de um bug num projeto, pelo id: o Bug do projeto, senão a Task, senão o
 * primeiro tipo que não é subtarefa; null quando o Jira não listou nenhum.
 */
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
