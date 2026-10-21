import type { RequestOutcome } from '@/modules/Run/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ParseKeys } from 'i18next';

export const REQUEST_OUTCOMES: Record<
  RequestOutcome,
  { icon: IconName; tone: 'pass' | 'quiet' | 'attn' | 'fail'; wordKey: ParseKeys | null }
> = {
  ok: { icon: 'passed', tone: 'pass', wordKey: null },
  redirect: { icon: 'redirect', tone: 'quiet', wordKey: null },
  client: { icon: 'attention', tone: 'attn', wordKey: null },
  server: { icon: 'failed', tone: 'fail', wordKey: null },
  failed: { icon: 'blocked', tone: 'fail', wordKey: 'RUN.NETWORK_FAILED' },
  canceled: { icon: 'skipped', tone: 'quiet', wordKey: 'RUN.NETWORK_CANCELED' },
  unknown: { icon: 'skipped', tone: 'quiet', wordKey: null },
};
