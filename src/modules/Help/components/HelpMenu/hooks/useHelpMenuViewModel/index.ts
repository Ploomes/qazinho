import type { IHelpMenuProps } from '@/modules/Help/components/HelpMenu/types';
import type { CSSProperties } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HELP_LINKS, HELP_MENU, RELEASE_NOTES } from '@/modules/Help/constants';
import { newsLinesOf, releaseDayOf } from '@/modules/Help/library';
import { APP_VERSION } from '@/modules/Settings/constants';
import { Contact, Platform } from '@/services';
import { STICKER } from '@/shared/constants';
import { useDismiss } from '@/shared/hooks';
import { useAppStore } from '@/store';

export const useHelpMenuViewModel = (props: IHelpMenuProps) => {
  const { t, i18n } = useTranslation();
  const openModal = useAppStore((state) => state.openModal);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [place, setPlace] = useState<{ left: number; bottom: number } | null>(null);
  const close = () => {
    setPlace(null);
  };
  const menuRef = useDismiss<HTMLDivElement>(close);
  const platform = Platform.current();
  const system = t(
    platform === 'darwin'
      ? 'HELP.SYSTEM_MAC'
      : platform === 'win32'
        ? 'HELP.SYSTEM_WINDOWS'
        : 'HELP.SYSTEM_LINUX',
  );

  const leave = (url: string) => {
    close();
    window.open(url, '_blank', 'noreferrer');
  };

  const write = (letter: { subject: string; body: string }) => {
    close();
    void Contact.write(letter);
  };

  return {
    anchorRef,
    menuRef,
    label: t('HELP.LABEL'),
    tipSide: props.side === 'right' ? ('right' as const) : ('below' as const),
    buttonSize: props.side === 'right' ? ('md' as const) : ('sm' as const),
    entry: props.side === 'right' ? STICKER.slap : STICKER.rise,
    isOpen: place !== null,
    menuStyle: {
      '--help-menu-left': `${String(place?.left ?? 0)}px`,
      '--help-menu-bottom': `${String(place?.bottom ?? 0)}px`,
      '--help-menu-width': `${String(HELP_MENU.widthPx)}px`,
    } as CSSProperties,
    news: newsLinesOf({
      notes: RELEASE_NOTES,
      version: APP_VERSION,
      count: HELP_MENU.newsCount,
    }).map((line) => ({
      key: line.version,
      text: t(line.noteKey),
      day: releaseDayOf({ date: line.date, language: i18n.language }),
    })),
    onToggle: () => {
      const anchor = anchorRef.current;

      if (place !== null || anchor === null) {
        close();
        return;
      }

      const box = anchor.getBoundingClientRect();

      setPlace(
        props.side === 'right'
          ? { left: box.right + HELP_MENU.gapPx, bottom: window.innerHeight - box.bottom }
          : {
              left: Math.min(
                Math.max(box.right - HELP_MENU.widthPx, HELP_MENU.edgePx),
                window.innerWidth - HELP_MENU.widthPx - HELP_MENU.edgePx,
              ),
              bottom: window.innerHeight - box.top + HELP_MENU.gapPx,
            },
      );
    },
    onNews: () => {
      close();
      openModal('news');
    },
    onGuides: () => {
      leave(HELP_LINKS.guides);
    },
    onDiscord: () => {
      leave(HELP_LINKS.discord);
    },
    onReport: () => {
      write({
        subject: t('HELP.REPORT_SUBJECT', { version: APP_VERSION }),
        body: t('HELP.REPORT_BODY', { version: APP_VERSION, system }),
      });
    },
    onFeedback: () => {
      write({
        subject: t('HELP.FEEDBACK_SUBJECT'),
        body: t('HELP.FEEDBACK_BODY', { version: APP_VERSION, system }),
      });
    },
  };
};
