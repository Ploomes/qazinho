import type { IStoredVariable } from '@/main/classes/storage/VariableVault/types';
import type { IApplyVariables, VariableFailure } from '@/shared/types';
import { VARIABLE_NAME } from '@/shared/constants';

/**
 * Every variable once a project's changes are applied in order, or the first change that
 * breaks a rule, with nothing applied.
 */
export function variablesAfter(props: {
  stored: IStoredVariable[];
  apply: IApplyVariables;
}): { stored: IStoredVariable[] } | { failure: VariableFailure } {
  const { projectId, changes } = props.apply;
  const others = props.stored.filter((one) => one.projectId !== projectId);
  let own = props.stored.filter((one) => one.projectId === projectId);

  for (const change of changes) {
    if (change.kind === 'remove') {
      own = own.filter(({ name }) => name !== change.name);

      continue;
    }

    const { name } = change;

    if (!VARIABLE_NAME.pattern.test(name) || name.length > VARIABLE_NAME.maxLength)
      return { failure: { reason: 'bad-name', name } };

    const before = own.find((one) => one.name === (change.from ?? name));

    if (change.from !== null && before === undefined)
      return { failure: { reason: 'missing', name: change.from } };

    if (before?.name !== name && own.some((one) => one.name === name))
      return { failure: { reason: 'taken', name } };

    const value = change.value ?? before?.value ?? '';

    if (value.length === 0) return { failure: { reason: 'no-value', name } };

    const saved = { projectId, name, description: change.description.trim(), value };

    own =
      before === undefined
        ? [...own, saved]
        : own.map((one) => (one === before ? saved : one));
  }

  return { stored: [...others, ...own] };
}
