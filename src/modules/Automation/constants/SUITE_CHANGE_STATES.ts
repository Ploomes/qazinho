import type { SuiteChangeStatus } from '@/modules/Automation/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { InternMood } from '@/shared/components/atoms/Intern/types';
import type { ParseKeys } from 'i18next';

export const SUITE_CHANGE_STATES: Record<
  SuiteChangeStatus,
  {
    icon: IconName;
    tone: 'lime' | 'pass' | 'fail' | 'attn' | 'quiet';
    mood: InternMood;
    labelKey: ParseKeys;
  }
> = {
  working: {
    icon: 'running',
    tone: 'lime',
    mood: 'thinking',
    labelKey: 'AUTOMATION.CHANGE_WORKING',
  },
  ready: {
    icon: 'sparkle',
    tone: 'lime',
    mood: 'passed',
    labelKey: 'AUTOMATION.CHANGE_READY',
  },
  'app-bug': {
    icon: 'bug',
    tone: 'fail',
    mood: 'bug',
    labelKey: 'AUTOMATION.CHANGE_APP_BUG',
  },
  'gave-up': {
    icon: 'attention',
    tone: 'attn',
    mood: 'broken',
    labelKey: 'AUTOMATION.CHANGE_GAVE_UP',
  },
  broke: {
    icon: 'failed',
    tone: 'fail',
    mood: 'broken',
    labelKey: 'AUTOMATION.CHANGE_BROKE',
  },
  stopped: {
    icon: 'stopped',
    tone: 'quiet',
    mood: 'sleeping',
    labelKey: 'AUTOMATION.CHANGE_STOPPED',
  },
  shipped: {
    icon: 'passed',
    tone: 'pass',
    mood: 'passed',
    labelKey: 'AUTOMATION.CHANGE_SHIPPED',
  },
  discarded: {
    icon: 'skipped',
    tone: 'quiet',
    mood: 'neutral',
    labelKey: 'AUTOMATION.CHANGE_DISCARDED',
  },
};
