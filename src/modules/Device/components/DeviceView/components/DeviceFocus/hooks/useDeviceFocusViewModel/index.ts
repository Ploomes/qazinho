import type { IDeviceFocusProps } from '@/modules/Device/components/DeviceView/components/DeviceFocus/types';
import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DEVICE } from '@/modules/Device/constants';
import { TITLEBAR } from '@/shared/components/organisms/Titlebar/constants';
import { useFollowEnd } from '@/shared/hooks/useFollowEnd';

export const useDeviceFocusViewModel = (props: IDeviceFocusProps) => {
  const { steps, onClose } = props;
  const { t } = useTranslation();
  const { listRef: stepsRef, onFollowScroll: onStepsScroll } =
    useFollowEnd<HTMLDivElement>({ resetKey: null, isOn: props.isLive });

  useEffect(() => {
    const leave = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', leave);

    return () => {
      window.removeEventListener('keydown', leave);
    };
  }, [onClose]);

  const current =
    steps.find(({ verdict }) => verdict === 'running') ??
    steps.find(({ verdict }) => verdict === 'pending') ??
    null;

  return {
    style: {
      '--focus-top': `${String(TITLEBAR.height)}px`,
      '--focus-side': `${String(DEVICE.focusSide)}px`,
      '--focus-chrome': `${String(DEVICE.focusChrome)}px`,
      '--focus-ratio': String(props.ratio),
    } as CSSProperties,
    nowEyebrow:
      current?.verdict === 'running' ? t('DEVICE.FOCUS_NOW') : t('DEVICE.FOCUS_NEXT'),
    now: current === null ? t('DEVICE.FOCUS_ALL_DONE') : current.action,
    nowNumber: current === null ? null : current.number,
    rows: steps
      .filter(({ verdict }) => verdict !== 'pending')
      .map((step) => ({ ...step, isCurrent: step.number === current?.number })),
    stepsRef,
    onStepsScroll,
    hasViewports: props.viewports.length > 0,
  };
};
