import type { IRunPickerProps } from '@/modules/Run/screens/Runs/components/RunPicker/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDismiss } from '@/shared/hooks';

export const useRunPickerViewModel = (props: IRunPickerProps) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });

  return {
    ref,
    isOpen,
    triggerClassName: isOpen
      ? 'run-picker__trigger run-picker__trigger--open'
      : 'run-picker__trigger',
    label: t('RUN.PICKER_LABEL'),
    count:
      props.total === 1
        ? t('RUN.PICKER_COUNT_ONE')
        : t('RUN.PICKER_COUNT_OTHER', { count: props.total }),
    rows: props.runs.map((row) => ({
      ...row,
      check: row.isSelected ? '✓' : '',
      className: row.isSelected
        ? 'run-picker__option run-picker__option--selected'
        : 'run-picker__option',
    })),
    onToggle: () => {
      setOpen(!isOpen);
    },
    onPick: (runId: string) => {
      setOpen(false);
      props.onSelect(runId);
    },
  };
};
