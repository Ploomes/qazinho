import type { IVariableDraft } from '@/modules/Project/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VARIABLES_MODAL } from '@/modules/Project/components/VariablesModal/constants';
import { VARIABLE_FAILURE_KEYS } from '@/modules/Project/constants';
import { useVariableActions } from '@/modules/Project/hooks/useVariableActions';
import {
  isSecretName,
  variableNameOf,
  variableProblemOf,
} from '@/modules/Project/library';
import { useAppStore, useVariablesStore } from '@/store';

export const useVariablesModalViewModel = () => {
  const { t } = useTranslation();
  const request = useVariablesStore((state) => state.request);
  const byProject = useVariablesStore((state) => state.byProject);
  const settle = useVariablesStore((state) => state.settle);
  const projects = useAppStore((state) => state.projects);
  const { applyVariables } = useVariableActions();
  const [rows, setRows] = useState<IVariableDraft[]>(() =>
    (request?.drafts ?? []).map((draft, index) => ({
      key: String(index),
      name: variableNameOf(draft.name),
      description: draft.description,
      value: '',
      from: null,
      isSecret: null,
    })),
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  const kept = request === null ? [] : (byProject[request.projectId] ?? []);
  const problem = variableProblemOf(rows);
  const secretOf = (row: IVariableDraft) => row.isSecret ?? isSecretName(row.name);
  const change = (props: { key: string; draft: Partial<IVariableDraft> }) => {
    setFailure(null);
    setRows((current) =>
      current.map((row) => (row.key === props.key ? { ...row, ...props.draft } : row)),
    );
  };

  return {
    width: VARIABLES_MODAL.width,
    title: t('VARIABLES.TITLE', {
      project: projects.find(({ id }) => id === request?.projectId)?.name ?? '',
    }),
    valuePlaceholder: t('VARIABLES.VALUE_PLACEHOLDER'),
    rows: rows.map((row, index) => ({
      key: row.key,
      isValueFocused: index === 0,
      isValueOnly: (request?.drafts[index]?.name ?? '') !== '',
      name: row.name,
      description: row.description,
      value: row.value,
      isSecret: secretOf(row),
      note: kept.some(({ name }) => name === row.name) ? t('VARIABLES.REPLACES') : '',
      onName: (typed: string) => {
        change({ key: row.key, draft: { name: variableNameOf(typed) } });
      },
      onDescription: (description: string) => {
        change({ key: row.key, draft: { description } });
      },
      onValue: (value: string) => {
        change({ key: row.key, draft: { value } });
      },
      onSecret: (isSecret: boolean) => {
        change({ key: row.key, draft: { isSecret } });
      },
    })),
    hint:
      failure ??
      (problem === null || problem.key === 'VARIABLES.NEEDS_VALUE'
        ? undefined
        : t(problem.key, { name: problem.name })),
    confirmLabel: isSaving ? t('VARIABLES.SAVING') : t('VARIABLES.SAVE'),
    canConfirm: problem === null && !isSaving,
    onCancel: () => {
      if (request !== null && !isSaving) settle({ id: request.id, saved: null });
    },
    onConfirm: () => {
      if (request === null || problem !== null || isSaving) return;

      setSaving(true);
      void applyVariables({
        projectId: request.projectId,
        changes: rows.map((row) => ({
          kind: 'save' as const,
          name: row.name,
          description: row.description,
          value: row.value,
          from: null,
          isSecret: secretOf(row),
        })),
      }).then((outcome) => {
        if (outcome.isSaved) {
          settle({ id: request.id, saved: rows.map(({ name }) => name) });

          return;
        }

        setSaving(false);
        setFailure(
          t(
            VARIABLE_FAILURE_KEYS[outcome.failure.reason],
            'name' in outcome.failure ? { name: outcome.failure.name } : {},
          ),
        );
      });
    },
  };
};
