import type { IVariableDraft } from '@/modules/Project/types';
import type { IVariableBrief, VariableChange } from '@/shared/types';
import { isSecretName } from './isSecretName';

/**
 * O que salvar estes rascunhos muda nas variáveis que o projeto guarda: as removidas
 * primeiro, depois cada uma nova ou mudada.
 */
export function variableChangesOf(props: {
  saved: IVariableBrief[];
  drafts: IVariableDraft[];
}): VariableChange[] {
  const { saved, drafts } = props;
  const removed = saved
    .filter(({ name }) => !drafts.some(({ from }) => from === name))
    .map(({ name }): VariableChange => ({ kind: 'remove', name }));
  const kept = drafts.flatMap((draft): VariableChange[] => {
    const before = saved.find(({ name }) => name === draft.from);
    const isSecret = draft.isSecret ?? isSecretName(draft.name);
    const isSame =
      before !== undefined &&
      draft.name === before.name &&
      draft.description.trim() === before.description &&
      isSecret === (before.isSecret ?? true) &&
      draft.value.length === 0;

    return isSame
      ? []
      : [
          {
            kind: 'save',
            name: draft.name,
            description: draft.description.trim(),
            value: draft.value.length === 0 ? null : draft.value,
            from: before === undefined ? null : before.name,
            isSecret,
          },
        ];
  });

  return [...removed, ...kept];
}
