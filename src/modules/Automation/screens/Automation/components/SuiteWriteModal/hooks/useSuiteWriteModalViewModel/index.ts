import type { ISuiteWriteModalProps } from '@/modules/Automation/screens/Automation/components/SuiteWriteModal/types';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUITE_WRITE } from '@/modules/Automation/screens/Automation/components/SuiteWriteModal/constants';

export const useSuiteWriteModalViewModel = (props: ISuiteWriteModalProps) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [caseQuery, setCaseQuery] = useState('');
  const [sourceAt, setSourceAt] = useState<number | null>(null);
  const [folderQuery, setFolderQuery] = useState('');
  const [folder, setFolder] = useState('');
  const source = sourceAt === null ? null : (props.cases[sourceAt] ?? null);
  const canAsk = props.canWrite && (text.trim() !== '' || source !== null);
  const holds = (query: string, ...texts: string[]) =>
    texts.some((one) => one.toLowerCase().includes(query.trim().toLowerCase()));

  return {
    title: t('AUTOMATION.WRITE_TITLE'),
    subtitle: t('AUTOMATION.WRITE_SUBTITLE'),
    width: SUITE_WRITE.width,
    rows: SUITE_WRITE.rows,
    confirmLabel: t('AUTOMATION.WRITE_ASK'),
    canConfirm: canAsk,
    hint: props.canWrite ? undefined : props.note,
    onConfirm: () => {
      if (canAsk) props.onWrite({ text: text.trim(), folder, source });
    },
    onCancel: props.onClose,
    whatLabel: t('AUTOMATION.WRITE_WHAT'),
    placeholder: t('AUTOMATION.WRITE_PLACEHOLDER'),
    text,
    onText: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    fromLabel: t('AUTOMATION.WRITE_FROM'),
    fromNote: t('AUTOMATION.WRITE_FROM_NOTE'),
    clearLabel: t('AUTOMATION.WRITE_CLEAR'),
    source:
      source === null
        ? null
        : { label: `${source.id} · ${source.title}`, detail: source.workspace },
    onClearSource: () => {
      setSourceAt(null);
    },
    noCases: props.cases.length === 0 ? t('AUTOMATION.WRITE_NO_CASES') : '',
    caseSearch: {
      query: caseQuery,
      label: t('AUTOMATION.WRITE_FROM_SEARCH'),
      placeholder: t('AUTOMATION.WRITE_FROM_SEARCH'),
      items: props.cases
        .map((one, index) => ({
          id: String(index),
          label: `${one.id} · ${one.title}`,
          tag: one.workspace,
          detail: one.goal === '' ? null : one.goal,
        }))
        .filter((item) => holds(caseQuery, item.label, item.tag, item.detail ?? '')),
      note: null,
      emptyText: t('AUTOMATION.WRITE_FROM_NONE', { query: caseQuery.trim() }),
    },
    onCaseQuery: setCaseQuery,
    onPickCase: (id: string) => {
      setSourceAt(Number(id));
      setCaseQuery('');
    },
    whereLabel: t('AUTOMATION.WRITE_WHERE'),
    whereNote: t('AUTOMATION.WRITE_WHERE_SUITE'),
    folder: folder === '' ? null : folder,
    onClearFolder: () => {
      setFolder('');
    },
    folderSearch: {
      query: folderQuery,
      label: t('AUTOMATION.WRITE_WHERE_SEARCH'),
      placeholder: t('AUTOMATION.WRITE_WHERE_SEARCH'),
      items: props.folders
        .filter(({ path }) => path !== '' && holds(folderQuery, path))
        .map(({ path, files }) => {
          const count = files.reduce((sum, file) => sum + file.tests.length, 0);

          return {
            id: path,
            label: path,
            tag:
              count === 1
                ? t('AUTOMATION.TESTS_ONE')
                : t('AUTOMATION.TESTS_OTHER', { count }),
            detail: null,
          };
        }),
      note: null,
      emptyText: t('AUTOMATION.WRITE_WHERE_NONE', { query: folderQuery.trim() }),
    },
    onFolderQuery: setFolderQuery,
    onPickFolder: (path: string) => {
      setFolder(path);
      setFolderQuery('');
    },
  };
};
