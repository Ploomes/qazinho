import type { IVariableDraft, VariableProblem } from '@/modules/Project/types';
import { VARIABLE_NAME } from '@/shared/constants';

/**
 * A primeira coisa que impede estas variáveis de serem salvas: um nome faltando, fora da
 * regra ou repetido, ou uma nova sem valor.
 */
export function variableProblemOf(drafts: IVariableDraft[]): VariableProblem {
  for (const [index, draft] of drafts.entries()) {
    const { name } = draft;

    if (name.length === 0) return { key: 'VARIABLES.NEEDS_NAME', name };

    if (!VARIABLE_NAME.pattern.test(name)) return { key: 'VARIABLES.BAD_NAME', name };

    if (drafts.slice(0, index).some((other) => other.name === name))
      return { key: 'VARIABLES.TWICE', name };

    if (draft.from === null && draft.value.length === 0)
      return { key: 'VARIABLES.NEEDS_VALUE', name };
  }

  return null;
}
