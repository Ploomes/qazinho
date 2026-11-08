import type { IBugFlashProps } from '@/modules/Device/components/DeviceView/components/DeviceScreen/components/BugFlash/types';
import type { IScreenBox } from '@/shared/types';
import type { CSSProperties } from 'react';
import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NO_BUG_FLASHES } from '@/modules/Device/components/DeviceView/components/DeviceScreen/components/BugFlash/constants';
import { BUG_FLASH } from '@/modules/Device/constants';
import { bugFlashHeadlineOf, bugFlashHoldOf, bugFocusOf } from '@/modules/Device/library';
import { useWorkspaceStore } from '@/store';

export const useBugFlashViewModel = (props: IBugFlashProps) => {
  const { workspaceId } = props;
  const { t } = useTranslation();
  const queue = useWorkspaceStore((state) =>
    workspaceId === null
      ? NO_BUG_FLASHES
      : (state.bugFlashes[workspaceId] ?? NO_BUG_FLASHES),
  );
  const shift = useWorkspaceStore((state) => state.shiftBugFlash);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const [isHeld, setHeld] = useState(false);
  const flash = queue[0] ?? null;
  const flashId = flash?.id ?? null;
  const holdFor = useEffectEvent(() =>
    bugFlashHoldOf({
      title: flash?.title ?? '',
      waiting: queue.length - 1,
      isQuiet: flash?.isQuiet === true,
      hasFocus: (flash?.box ?? null) !== null,
    }),
  );

  useEffect(() => {
    if (flashId === null || workspaceId === null || isHeld) return;

    const timer = window.setTimeout(() => {
      setHeld(false);
      shift({ workspaceId, id: flashId });
    }, holdFor());

    return () => {
      window.clearTimeout(timer);
    };
  }, [flashId, workspaceId, isHeld, shift]);

  const headlineKey = flash === null ? null : bugFlashHeadlineOf(flash);
  const focus =
    (flash?.box ?? null) === null ? null : bugFocusOf(flash?.box as IScreenBox);

  return {
    flash,
    style: {
      '--photo-share': String(BUG_FLASH.photoShare),
      '--flash-blur': `${String(BUG_FLASH.blurPx)}px`,
      '--flash-bezel': `${String(BUG_FLASH.bezelPx)}px`,
      '--flash-caption-gap': `${String(BUG_FLASH.captionGapPx)}px`,
      '--flash-caption-min': `${String(BUG_FLASH.captionMinPx)}px`,
      '--flash-corner': `${String(BUG_FLASH.cornerPx)}px`,
      '--flash-corner-gap': `${String(BUG_FLASH.cornerGapPx)}px`,
      '--flash-corner-stroke': `${String(BUG_FLASH.cornerStrokePx)}px`,
      '--flash-focus-corner': `${String(BUG_FLASH.focusCornerPx)}px`,
      '--flash-mira-room': `${String(BUG_FLASH.miraRoomPx)}px`,
      '--flash-spot-room': `${String(BUG_FLASH.spotRoomPx)}px`,
      '--flash-focus-delay': `${String(BUG_FLASH.focusDelayMs)}ms`,
      '--flash-focus-time': `${String(BUG_FLASH.focusMs)}ms`,
      ...(focus === null
        ? {}
        : {
            '--focus-zoom': String(focus.zoom),
            '--focus-x': String(focus.shiftX),
            '--focus-y': String(focus.shiftY),
            '--focus-left': String(focus.left),
            '--focus-top': String(focus.top),
            '--focus-width': String(focus.width),
            '--focus-height': String(focus.height),
          }),
    } as CSSProperties,
    eyebrow: t(flash?.isSeenAgain === true ? 'DEVICE.BUG_AGAIN' : 'DEVICE.BUG_CAUGHT'),
    headline: headlineKey === null ? (flash?.title ?? '') : t(headlineKey),
    detail: headlineKey === null ? null : (flash?.title ?? null),
    photoAlt: t('DEVICE.BUG_SHOT_ALT'),
    hasFocus: focus !== null,
    imageClassName:
      focus === null ? 'bug-flash__image' : 'bug-flash__image bug-flash__image--focus',
    miraClassName:
      focus === null ? 'bug-flash__mira' : 'bug-flash__mira bug-flash__mira--focus',
    shutterClassName:
      flash?.isQuiet === true
        ? 'bug-flash__shutter bug-flash__shutter--soft'
        : 'bug-flash__shutter',
    onHoldStart: () => {
      setHeld(true);
    },
    onHoldEnd: () => {
      setHeld(false);
    },
    onOpen: () => {
      if (flash === null) return;

      if (openBugId !== flash.bugId) toggleBug(flash.bugId);

      selectTab('bugs');
    },
  };
};
