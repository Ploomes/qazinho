import type { IRunPickerProps } from '@/modules/Run/screens/Runs/components/RunPicker/types';
import { useState } from 'react';
import { useDismiss } from '@/shared/hooks';

export const useRunPickerViewModel = (props: IRunPickerProps) => {
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
    canPick: props.total > 1,
    rows: props.runs.map((row) => ({
      ...row,
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
