import { useState } from 'react';

export const useTooltipViewModel = () => {
  const [isOpen, setOpen] = useState(false);

  return {
    isOpen,
    onOpen: () => {
      setOpen(true);
    },
    onClose: () => {
      setOpen(false);
    },
  };
};
