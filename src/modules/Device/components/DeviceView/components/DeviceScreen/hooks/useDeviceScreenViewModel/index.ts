import type { IDeviceScreenProps } from '@/modules/Device/components/DeviceView/components/DeviceScreen/types';
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
  SyntheticEvent,
  WheelEvent,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEVICE_TOUCH } from '@/modules/Device/constants';
import { deviceKeyOf, touchFractionOf } from '@/modules/Device/library';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';

export const useDeviceScreenViewModel = (props: IDeviceScreenProps) => {
  const { onTouch } = props;
  const { t } = useTranslation();
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const pressed = useRef<{ clientX: number; clientY: number } | null>(null);
  const typed = useRef<{ text: string; timer: ReturnType<typeof setTimeout> | null }>({
    text: '',
    timer: null,
  });
  const wheeled = useRef<{
    x: number;
    y: number;
    dx: number;
    dy: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ x: 0, y: 0, dx: 0, dy: 0, timer: null });
  const workspaceId = useSelectedWorkspacePart(({ id }) => ({ id }))?.id ?? null;
  const ratio =
    props.fitsWhole === true && naturalRatio !== null ? naturalRatio : props.ratio;

  const sendText = () => {
    const { text, timer } = typed.current;

    if (timer !== null) clearTimeout(timer);

    typed.current = { text: '', timer: null };

    if (text.length > 0) onTouch?.({ kind: 'type', text });
  };

  const sendScroll = () => {
    const { x, y, dx, dy, timer } = wheeled.current;

    if (timer !== null) clearTimeout(timer);

    wheeled.current = { x, y, dx: 0, dy: 0, timer: null };

    if (dx !== 0 || dy !== 0) onTouch?.({ kind: 'scroll', x, y, dx, dy });
  };

  useEffect(
    () => () => {
      if (typed.current.timer !== null) clearTimeout(typed.current.timer);

      if (wheeled.current.timer !== null) clearTimeout(wheeled.current.timer);
    },
    [],
  );

  return {
    className: [
      'device-screen',
      props.stream === null ? '' : 'device-screen--streaming',
      onTouch === undefined ? '' : 'device-screen--touchable',
    ]
      .filter((part) => part !== '')
      .join(' '),
    style: { '--screen-ratio': String(ratio) } as CSSProperties,
    workspaceId,
    surfaceStream: onTouch === undefined ? null : props.stream,
    touchLabel: t('DEVICE.TOUCH_LABEL'),
    onStreamLoad: (event: SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = event.currentTarget;

      if (naturalWidth > 0 && naturalHeight > 0)
        setNaturalRatio(naturalWidth / naturalHeight);
    },
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      pressed.current = { clientX: event.clientX, clientY: event.clientY };
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      const from = pressed.current;

      pressed.current = null;

      if (from === null) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const at = touchFractionOf({ ...from, rect });
      const isTap =
        Math.hypot(event.clientX - from.clientX, event.clientY - from.clientY) <
        DEVICE_TOUCH.tapSlopPx;

      sendText();

      if (isTap) {
        onTouch?.({ kind: 'tap', ...at });

        return;
      }

      const to = touchFractionOf({
        clientX: event.clientX,
        clientY: event.clientY,
        rect,
      });

      onTouch?.({ kind: 'drag', x: at.x, y: at.y, toX: to.x, toY: to.y });
    },
    onWheel: (event: WheelEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const at = touchFractionOf({
        clientX: event.clientX,
        clientY: event.clientY,
        rect,
      });
      const kept = wheeled.current;

      wheeled.current = {
        ...at,
        dx: kept.dx + event.deltaX / Math.max(rect.width, 1),
        dy: kept.dy + event.deltaY / Math.max(rect.height, 1),
        timer: kept.timer ?? setTimeout(sendScroll, DEVICE_TOUCH.wheelFlushMs),
      };
    },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = deviceKeyOf(event.key);

      if (key !== null) {
        event.preventDefault();
        sendText();
        onTouch?.({ kind: 'key', key });

        return;
      }

      if ([...event.key].length !== 1) return;

      event.preventDefault();

      const kept = typed.current;

      typed.current = {
        text: `${kept.text}${event.key}`,
        timer: kept.timer ?? setTimeout(sendText, DEVICE_TOUCH.typeFlushMs),
      };
    },
  };
};
