import type { IViewportPickerProps } from '@/modules/Device/components/DeviceView/components/ViewportPicker/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDismiss } from '@/shared/hooks';

export const useViewportPickerViewModel = (props: IViewportPickerProps) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });

  return {
    ref,
    isOpen,
    label: t('DEVICE.VIEWPORT'),
    current: props.viewports.find(({ isActive }) => isActive)?.size ?? '',
    onToggle: () => {
      setOpen(!isOpen);
    },
    options: props.viewports.map((option) => ({
      ...option,
      onSelect: () => {
        setOpen(false);
        props.onSelect(option.id);
      },
    })),
  };
};
