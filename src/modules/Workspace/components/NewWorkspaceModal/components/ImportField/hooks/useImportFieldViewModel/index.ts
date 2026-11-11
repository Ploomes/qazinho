import type { IImportFieldProps } from '@/modules/Workspace/components/NewWorkspaceModal/components/ImportField/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IMPORT_FIELD_FAILURE_KEYS } from '@/modules/Workspace/components/NewWorkspaceModal/components/ImportField/constants';
import { Imports } from '@/services';

export const useImportFieldViewModel = (props: IImportFieldProps) => {
  const { folder, onChange } = props;
  const { t } = useTranslation();
  const [isPicking, setPicking] = useState(false);
  const [failure, setFailure] = useState<'empty' | 'unreadable' | null>(null);

  return {
    hasFolder: folder !== null,
    isPicking,
    name: folder?.name ?? '',
    kinds:
      folder === null
        ? ''
        : folder.frameworks.length === 0
          ? t('COMMANDS.IMPORT_UNKNOWN')
          : folder.frameworks.map(({ id }) => id).join(', '),
    path: folder?.dir ?? '',
    pickLabel: t('NEW_WORKSPACE.IMPORT_PICK'),
    removeLabel: t('NEW_WORKSPACE.IMPORT_REMOVE'),
    failureText: failure === null ? null : t(IMPORT_FIELD_FAILURE_KEYS[failure]),
    onPick: () => {
      setPicking(true);
      void Imports.pick().then((picked) => {
        setPicking(false);
        setFailure(picked.kind === 'failed' ? picked.reason : null);

        if (picked.kind === 'picked') onChange(picked.source);
      });
    },
    onRemove: () => {
      setFailure(null);
      onChange(null);
    },
  };
};
