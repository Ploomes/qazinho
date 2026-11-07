import type { IVariableFieldProps } from '@/modules/Project/components/ProjectModal/components/VariableField/types';
import type { IVariableDraft } from '@/modules/Project/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isSecretName,
  variableNameOf,
  variableProblemOf,
} from '@/modules/Project/library';
import { Variables } from '@/services';

export const useVariableFieldViewModel = (props: IVariableFieldProps) => {
  const { projectId, variables, saved, onChange } = props;
  const { t } = useTranslation();
  const [editing, setEditing] = useState<IVariableDraft | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
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

  const secretOf = (draft: IVariableDraft) => draft.isSecret ?? isSecretName(draft.name);
  const reveal = (props: { key: string; value: string }) => {
    setRevealed((current) => ({ ...current, [props.key]: props.value }));
  };

  return {
    rows: variables.map((row) => ({
      key: row.key,
      name: row.name,
      description: row.description,
      isSecret: secretOf(row),
      shownValue: revealed[row.key] ?? null,
      revealIcon:
        revealed[row.key] === undefined ? ('eye' as const) : ('eyeSlash' as const),
      revealLabel:
        revealed[row.key] === undefined
          ? t('VARIABLES.SHOW_VALUE')
          : t('VARIABLES.HIDE_VALUE'),
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
            isSecret: secretOf(editing),
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
            onSecret: (isSecret: boolean) => {
              change({ isSecret });
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
        isSecret: null,
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
    onReveal: (key: string) => {
      const row = variables.find((one) => one.key === key);

      if (row === undefined || secretOf(row)) return;

      if (revealed[key] !== undefined) {
        setRevealed((current) =>
          Object.fromEntries(Object.entries(current).filter(([one]) => one !== key)),
        );

        return;
      }

      if (row.value.length > 0) {
        reveal({ key, value: row.value });

        return;
      }

      if (projectId === null || row.from === null) return;

      void Variables.reveal({ projectId, name: row.from }).then((value) => {
        if (value !== null) reveal({ key, value });
      });
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
