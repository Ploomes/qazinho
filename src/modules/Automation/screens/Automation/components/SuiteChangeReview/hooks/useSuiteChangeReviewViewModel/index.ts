import type { ISuiteChangeReviewProps } from '@/modules/Automation/screens/Automation/components/SuiteChangeReview/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { checkLookOf } from '@/modules/Automation/library';
import { SUITE_CHANGE_REVIEW } from '@/modules/Automation/screens/Automation/components/SuiteChangeReview/constants';
import { Suites } from '@/services';

export const useSuiteChangeReviewViewModel = (props: ISuiteChangeReviewProps) => {
  const { t } = useTranslation();
  const { change } = props;
  const [isSending, setSending] = useState(false);
  const [isSent, setSent] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const way = props.canOpenPullRequest ? 'pull-request' : 'branch';
  const check = checkLookOf(change.check);

  return {
    title: t('AUTOMATION.REVIEW_TITLE'),
    subtitle: t('AUTOMATION.REVIEW_SUBTITLE', { test: change.ask.test.title }),
    width: SUITE_CHANGE_REVIEW.width,
    height: SUITE_CHANGE_REVIEW.height,
    confirmLabel: t(
      way === 'pull-request' ? 'AUTOMATION.CHANGE_OPEN_PR' : 'AUTOMATION.CHANGE_PUSH',
    ),
    canConfirm: !isSending && !isSent,
    hint: isSending ? t('AUTOMATION.REVIEW_SENDING') : (failure ?? undefined),
    onConfirm: () => {
      if (isSending || isSent) return;

      setSending(true);
      setFailure(null);
      void Suites.ship({ projectId: change.projectId, changeId: change.id, way }).then(
        (outcome) => {
          setSending(false);

          if (outcome?.isOk === true) {
            props.onClose();

            return;
          }

          setSent(outcome?.change.status === 'shipped');
          setFailure(
            outcome === null
              ? t('AUTOMATION.CHANGE_FAILED_OTHER', { said: '' })
              : t(SUITE_CHANGE_REVIEW.failureKeys[outcome.step], { said: outcome.said }),
          );
        },
      );
    },
    onCancel: props.onClose,
    branch: change.branch,
    from: t('AUTOMATION.CHANGE_FROM', {
      base: change.base === '' ? 'HEAD' : change.base,
      commit: change.commit.slice(0, 7),
    }),
    summary: change.summary,
    check: {
      icon: check.icon,
      className: `suite-change-review__check suite-change-review__check--${check.tone}`,
      text: t(check.labelKey),
    },
    pullRequest:
      change.message.title === ''
        ? null
        : {
            label: t('AUTOMATION.REVIEW_PULL_REQUEST'),
            title: change.message.title,
            body: change.message.body,
          },
    filesLabel: t('AUTOMATION.REVIEW_FILES'),
    files: change.files.map((file, index) => ({
      key: file.path,
      file,
      isOpenAtFirst: index === 0,
    })),
    canDiscard: !isSending && !isSent,
    discardLabel: t('AUTOMATION.CHANGE_DISCARD'),
    onDiscard: () => {
      if (isSending || isSent) return;

      void Suites.discard({ projectId: change.projectId, changeId: change.id }).then(
        () => {
          props.onClose();
        },
      );
    },
  };
};
