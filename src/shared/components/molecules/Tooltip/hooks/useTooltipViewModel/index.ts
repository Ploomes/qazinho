import type { CSSProperties } from 'react';
import { useState } from 'react';
import { TOOLTIP } from '@/shared/components/molecules/Tooltip/constants';

export const useTooltipViewModel = () => {
  const [isOpen, setOpen] = useState(false);

  return {
    isOpen,
    style: { '--tooltip-max': `${String(TOOLTIP.maxWidthPx)}px` } as CSSProperties,
    onOpen: () => {
      setOpen(true);
    },
    onClose: () => {
      setOpen(false);
    },
  };
};
