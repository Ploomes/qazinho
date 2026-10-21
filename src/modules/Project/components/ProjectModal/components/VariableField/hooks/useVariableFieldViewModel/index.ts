import type { IVariableFieldProps } from '@/modules/Project/components/ProjectModal/components/VariableField/types';
import type { IVariableDraft } from '@/modules/Project/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { variableNameOf, variableProblemOf } from '@/modules/Project/library';

export const useVariableFieldViewModel = (props: IVariableFieldProps) => {
  const { variables, saved, onChange } = props;
  const { t } = useTranslation();
  const [editing, setEditing] = useState<IVariableDraft | null>(null);
  const [isAdding, setAdding] = useState(false);
  const [count, setCount] = useState(0);

  const others =
    editing === null ? variables : variables.filter(({ key }) => key !== editing.key);
  const problem = editing === null ? null : variableProblemOf([...others, editing]);
  const change = (draft: Partial<IVariableDraft>) => {
    setEditing((current) => (current === null ? null : { ...current, ...draft }));
  };
  const tagOf = (row: IVariableDraft) => {
    const before = saved.find(({ name }) => name === row.from);

    if (before === undefined) return t('PROJECT.VARIABLE_NEW');

    return row.name !== before.name ||
      row.description.trim() !== before.description ||
      row.value.length > 0
      ? t('PROJECT.VARIABLE_CHANGED')
      : '';
  };

  return {
    rows: variables.map((row) => ({
      key: row.key,
      name: row.name,
      description: row.description,
      tag: tagOf(row),
      isEditing: !isAdding && editing?.key === row.key,
      editLabel: t('PROJECT.VARIABLE_EDIT', { name: row.name }),
      removeLabel: t('PROJECT.VARIABLE_REMOVE', { name: row.name }),
    })),
    isAdding,
    canAdd: editing === null,
    isEmpty: variables.length === 0 && editing === null,
    emptyText: t('PROJECT.VARIABLES_EMPTY'),
    sealedLabel: t('VARIABLES.SEALED'),
    addLabel: t('PROJECT.VARIABLE_ADD'),
    doneLabel: t('PROJECT.VARIABLE_DONE'),
    cancelLabel: t('COMMON.CANCEL'),
    editor:
      editing === null
        ? null
        : {
            name: editing.name,
            description: editing.description,
            value: editing.value,
            valuePlaceholder:
              editing.from === null
                ? t('VARIABLES.VALUE_PLACEHOLDER')
                : t('VARIABLES.VALUE_KEEP'),
            problem: problem === null ? '' : t(problem.key, { name: problem.name }),
            canFinish: problem === null,
            onName: (typed: string) => {
              change({ name: variableNameOf(typed) });
            },
            onDescription: (description: string) => {
              change({ description });
            },
            onValue: (value: string) => {
              change({ value });
            },
          },
    onAdd: () => {
      if (editing !== null) return;

      setEditing({
        key: `new-${String(count)}`,
        name: '',
        description: '',
        value: '',
        from: null,
      });
      setCount(count + 1);
      setAdding(true);
    },
    onEdit: (key: string) => {
      const row = variables.find((one) => one.key === key);

      if (row === undefined || editing !== null) return;

      setEditing(row);
      setAdding(false);
    },
    onRemove: (key: string) => {
      onChange(variables.filter((one) => one.key !== key));

      if (editing?.key === key) setEditing(null);
    },
    onDone: () => {
      if (editing === null || problem !== null) return;

      onChange(
        isAdding
          ? [...variables, editing]
          : variables.map((one) => (one.key === editing.key ? editing : one)),
      );
      setEditing(null);
      setAdding(false);
    },
    onCancelEdit: () => {
      setEditing(null);
      setAdding(false);
    },
  };
};
