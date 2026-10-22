import type { IStepsPopupProps } from '@/shared/components/organisms/StepsPopup/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import {
  STEP_MARKS,
  STEPS_POPUP,
} from '@/shared/components/organisms/StepsPopup/constants';
import { MOTION } from '@/shared/constants';

export const useStepsPopupViewModel = (props: IStepsPopupProps) => {
  const { tone, onCancel, onClose } = props;
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const { shownCode, page } = props;
  const isShownCopied = shownCode !== null && copied === shownCode.code;
  const isWorking = tone === 'working';
  const isConnected = tone === 'connected';
  const isKept = props.isKept === true;

  useEffect(() => {
    const leave = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (isWorking) onCancel();
      else onClose();
    };

    window.addEventListener('keydown', leave);

    return () => {
      window.removeEventListener('keydown', leave);
    };
  }, [isWorking, onCancel, onClose]);

  useEffect(() => {
    if (!isConnected || isKept) return;

    const timer = setTimeout(onClose, STEPS_POPUP.closeAfterMs);

    return () => {
      clearTimeout(timer);
    };
  }, [isConnected, isKept, onClose]);

  return {
    style: {
      '--steps-width': `${String(STEPS_POPUP.width)}px`,
      '--steps-badge': `${String(STEPS_POPUP.badge)}px`,
      '--steps-mark': `${String(STEPS_POPUP.mark)}px`,
      '--steps-detail': `${String(STEPS_POPUP.detailHeight)}px`,
    } as CSSProperties,
    badgeClass: `steps-popup__badge steps-popup__badge--${tone}`,
    badgeMark: isConnected
      ? STEP_MARKS.done
      : tone === 'failed'
        ? STEP_MARKS.failed
        : null,
    rows: props.rows.map((row, index) => ({
      ...row,
      className: `steps-popup__step steps-popup__step--${row.state}`,
      markClass: `steps-popup__mark steps-popup__mark--${row.state}`,
      mark: STEP_MARKS[row.state],
      delay: Math.min(index * MOTION.stagger, MOTION.maxStagger),
    })),
    detailClass: props.detail?.isCommand
      ? 'steps-popup__detail steps-popup__detail--command'
      : 'steps-popup__detail',
    code,
    canSendCode: code.trim() !== '',
    onCodeChange: (value: string) => {
      setCode(value);
    },
    onCodeSubmit: () => {
      if (props.code === null || code.trim() === '') return;

      props.code.onSubmit(code.trim());
      setCode('');
    },
    shownCopyLabel: isShownCopied ? shownCode.copied : (shownCode?.copy ?? ''),
    onCopyShown: () => {
      if (shownCode === null) return;

      void navigator.clipboard?.writeText(shownCode.code).catch(() => undefined);
      setCopied(shownCode.code);

      if (page !== null) window.open(page.url, '_blank', 'noreferrer');
    },
    onBackdrop: () => {
      if (!isWorking) onClose();
    },
  };
};
