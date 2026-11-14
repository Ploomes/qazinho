import type { IMenuButtonProps } from '@/shared/components/molecules/MenuButton/types';
import { useState } from 'react';
import { useDismiss } from '@/shared/hooks/useDismiss';

export const useMenuButtonViewModel = (props: IMenuButtonProps) => {
  const [isOpen, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });

  return {
    ref,
    isOpen,
    label: props.label,
    icon: props.icon,
    caretClassName: isOpen
      ? 'menu-button__caret menu-button__caret--open'
      : 'menu-button__caret',
    items: props.items.map((item) => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      tip: item.tip,
      isDisabled: item.isDisabled === true,
      onPick: () => {
        if (item.isDisabled === true) return;

        setOpen(false);
        item.onPick();
      },
    })),
    onToggle: () => {
      setOpen(!isOpen);
    },
  };
};
