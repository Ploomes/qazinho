import type { IBugUpdateProps } from '@/modules/Bug/screens/Bugs/components/BugPage/components/BugUpdate/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBugReviews } from '@/modules/Bug/hooks/useBugReviews';
import { useSettingsStore } from '@/store';

export const useBugUpdateViewModel = (props: IBugUpdateProps) => {
  const { workspaceId, bug } = props;
  const { t } = useTranslation();
  const agent = useSettingsStore((state) => state.agent);
  const { post, dismiss, retry } = useBugReviews();
  const [draft, setDraft] = useState<string | null>(null);
  const { review, filed } = bug;
  const state = review?.state ?? 'dismissed';
  const key = filed?.key ?? '';
  const isRegression = review?.verdict === 'regression';
  const comment = draft ?? review?.comment ?? '';
  const isEditable = state === 'suggested' || state === 'posting';
  const icon: IconName =
    state === 'posted'
      ? 'passed'
      : state === 'failed'
        ? 'failed'
        : state === 'nothing-new'
          ? 'check'
          : isRegression
            ? 'attention'
            : 'sparkle';

  return {
    isShown: review !== null && filed !== null && state !== 'dismissed',
    className: isRegression
      ? `bug-update bug-update--${state} bug-update--regression`
      : `bug-update bug-update--${state}`,
    isWorking: state === 'reviewing',
    icon,
    title:
      state === 'reviewing'
        ? t('BUG_UPDATE.REVIEWING', { agent, runs: review?.runs.join(', ') ?? '', key })
        : state === 'posted'
          ? t('BUG_UPDATE.POSTED', { key })
          : state === 'failed'
            ? (review?.reason ?? '')
            : state === 'nothing-new'
              ? t('BUG_UPDATE.NOTHING_NEW', { key, reason: review?.reason ?? '' })
              : isRegression
                ? t('BUG_UPDATE.REGRESSION', { key })
                : t('BUG_UPDATE.SUGGESTED', { key }),
    reason: isEditable ? (review?.reason ?? '') : '',
    isEditable,
    commentLabel: t('BUG_UPDATE.COMMENT_LABEL'),
    comment,
    error: isEditable ? (review?.error ?? '') : '',
    canPost: state === 'suggested' && (isRegression || comment.trim() !== ''),
    postLabel:
      state === 'posting' ? t('BUG_UPDATE.POSTING') : t('BUG_UPDATE.POST', { key }),
    dismissLabel: t('BUG_UPDATE.DISMISS'),
    isPosted: state === 'posted' && review?.url !== null,
    viewLabel: t('BUG_UPDATE.VIEW_COMMENT'),
    isFailed: state === 'failed',
    retryLabel: t('COMMON.TRY_AGAIN'),
    onComment: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.target.value);
    },
    onPost: () => {
      if (state === 'suggested') void post({ workspaceId, bugId: bug.id, comment });
    },
    onDismiss: () => {
      dismiss({ workspaceId, bugId: bug.id });
    },
    onRetry: () => {
      retry({ workspaceId, bugId: bug.id });
    },
    onView: () => {
      if (review?.url) window.open(review.url, '_blank', 'noreferrer');
    },
  };
};
