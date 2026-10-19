import type { IUndoToastProps } from '@/modules/Plan/screens/Plan/components/UndoToast/types';
import type { CSSProperties } from 'react';
import { UNDO_TOAST } from '@/modules/Plan/screens/Plan/components/UndoToast/constants';

export const useUndoToastViewModel = (props: IUndoToastProps) => ({
  style: { '--undo-ms': `${String(UNDO_TOAST.durationMs)}ms` } as CSSProperties,
  onUndoClick: () => {
    props.onUndo();
  },
  onCountdownEnd: () => {
    props.onExpire();
  },
});
