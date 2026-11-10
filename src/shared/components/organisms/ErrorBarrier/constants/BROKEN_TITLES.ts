import type { ErrorRegion } from '@/shared/components/organisms/ErrorBarrier/types';
import type { ParseKeys } from 'i18next';

export const BROKEN_TITLES: Record<ErrorRegion, ParseKeys> = {
  tab: 'BROKEN.TITLE_TAB',
  chat: 'BROKEN.TITLE_CHAT',
  sidebar: 'BROKEN.TITLE_SIDEBAR',
  screen: 'BROKEN.TITLE_SCREEN',
};
