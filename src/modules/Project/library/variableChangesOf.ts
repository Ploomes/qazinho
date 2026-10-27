import type { IVariableDraft } from '@/modules/Project/types';
import type { IVariableBrief, VariableChange } from '@/shared/types';

/**
 * What saving these drafts changes in the variables the project keeps: the removed ones
 * first, then each one new or changed.
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
    const isSame =
      before !== undefined &&
      draft.name === before.name &&
      draft.description.trim() === before.description &&
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
          },
        ];
  });

  return [...removed, ...kept];
}
