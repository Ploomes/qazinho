import type { ProjectPick } from '@/modules/Home/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ParseKeys } from 'i18next';

export const PROJECT_PICKS: {
  id: Exclude<ProjectPick, 'none'>;
  icon: IconName;
  labelKey: ParseKeys;
  textKey: ParseKeys;
}[] = [
  {
    id: 'web',
    icon: 'web',
    labelKey: 'NEW_PROJECT.CARD_WEB',
    textKey: 'NEW_PROJECT.CARD_WEB_TEXT',
  },
  {
    id: 'build',
    icon: 'build',
    labelKey: 'NEW_PROJECT.CARD_BUILD',
    textKey: 'NEW_PROJECT.CARD_BUILD_TEXT',
  },
  {
    id: 'code',
    icon: 'branch',
    labelKey: 'NEW_PROJECT.CARD_CODE',
    textKey: 'NEW_PROJECT.CARD_CODE_TEXT',
  },
  {
    id: 'tests',
    icon: 'tests',
    labelKey: 'NEW_PROJECT.CARD_TESTS',
    textKey: 'NEW_PROJECT.CARD_TESTS_TEXT',
  },
  {
    id: 'story',
    icon: 'story',
    labelKey: 'NEW_PROJECT.CARD_STORY',
    textKey: 'NEW_PROJECT.CARD_STORY_TEXT',
  },
  {
    id: 'design',
    icon: 'figma',
    labelKey: 'NEW_PROJECT.CARD_DESIGN',
    textKey: 'NEW_PROJECT.CARD_DESIGN_TEXT',
  },
];
