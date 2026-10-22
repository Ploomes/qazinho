import type { ISuiteChangeCardProps } from '@/modules/Automation/screens/Automation/components/SuiteChangeCard/types';
import { useTranslation } from 'react-i18next';
import {
  SUITE_CHANGE_FAILURE_KEYS,
  SUITE_CHANGE_STATES,
} from '@/modules/Automation/constants';
import { checkLookOf } from '@/modules/Automation/library';
import { SUITE_CHANGE_CARD } from '@/modules/Automation/screens/Automation/components/SuiteChangeCard/constants';
import { MOTION } from '@/shared/constants';

export const useSuiteChangeCardViewModel = (props: ISuiteChangeCardProps) => {
  const { t } = useTranslation();
  const { change, agent } = props;
  const look = SUITE_CHANGE_STATES[change.status];
  const isWorking = change.status === 'working';
  const { failure, shipped } = change;
  const isWrite = change.ask.kind === 'write';
  const check = checkLookOf(change.checks);
  const canSend =
    change.status === 'ready' || (change.status === 'app-bug' && change.files.length > 0);
  const added = change.files.reduce((sum, file) => sum + file.additions, 0);
  const removed = change.files.reduce((sum, file) => sum + file.deletions, 0);
  const canEnd = ['gave-up', 'broke', 'stopped'].includes(change.status);
  const hasBranch = isWorking || change.files.length > 0;

  return {
    className: `suite-change-card suite-change-card--${look.tone}`,
    transition: { duration: MOTION.durationFast, ease: MOTION.ease },
    mood: look.mood,
    internSize: SUITE_CHANGE_CARD.internSize,
    isStill: !isWorking,
    icon: look.icon,
    title: t(isWrite ? look.writeLabelKey : look.labelKey),
    branch: hasBranch ? change.branch : '',
    from:
      !hasBranch || change.commit === ''
        ? ''
        : t('AUTOMATION.CHANGE_FROM', {
            base: change.base === '' ? 'HEAD' : change.base,
            commit: change.commit.slice(0, 7),
          }),
    isWorking,
    step:
      change.step === null
        ? ''
        : t(
            change.step === 'agent' && isWrite
              ? SUITE_CHANGE_CARD.writeStepKey
              : SUITE_CHANGE_CARD.stepKeys[change.step],
          ),
    notes: props.notes.slice(-SUITE_CHANGE_CARD.lines).map((note) =>
      note.kind === 'said'
        ? {
            key: String(note.id),
            icon: null,
            className: 'suite-change-card__note',
            text: note.text,
          }
        : {
            key: String(note.id),
            icon:
              note.total > 0 && note.passed === note.total
                ? ('passed' as const)
                : ('failed' as const),
            className: `suite-change-card__note suite-change-card__note--${note.total > 0 && note.passed === note.total ? 'pass' : 'fail'}`,
            text:
              note.total === 0
                ? t('AUTOMATION.CHANGE_RAN_NONE')
                : note.total === 1
                  ? t(
                      note.passed === 1
                        ? 'AUTOMATION.CHANGE_RAN_PASSED'
                        : 'AUTOMATION.CHANGE_RAN_FAILED',
                    )
                  : t('AUTOMATION.CHANGE_RAN_OTHER', {
                      count: note.total,
                      passed: note.passed,
                    }),
          },
    ),
    summary: change.summary,
    failure:
      failure === null
        ? ''
        : t(SUITE_CHANGE_FAILURE_KEYS[failure.reason], {
            agent,
            said: 'said' in failure ? failure.said : '',
            reason:
              failure.reason !== 'agent'
                ? ''
                : 'said' in failure.failure
                  ? failure.failure.said
                  : t(
                      failure.failure.reason === 'agent-signed-out'
                        ? 'AUTOMATION.CHANGE_AGENT_SIGNED_OUT'
                        : 'AUTOMATION.CHANGE_AGENT_SILENT',
                      { agent },
                    ),
          }),
    check: !canSend
      ? null
      : {
          icon: check.icon,
          className: `suite-change-card__check suite-change-card__check--${check.tone}`,
          text: t(check.labelKey, { count: check.count, failed: check.failed }),
        },
    files:
      change.files.length === 0
        ? ''
        : change.files.length === 1
          ? t('AUTOMATION.CHANGE_FILES_ONE')
          : t('AUTOMATION.CHANGE_FILES_OTHER', { count: change.files.length }),
    added: `+${String(added)}`,
    removed: `−${String(removed)}`,
    shipped:
      shipped === null
        ? null
        : {
            url: shipped.url,
            label:
              shipped.way === 'pull-request'
                ? t('AUTOMATION.CHANGE_SEE_PR')
                : shipped.url !== null
                  ? t('AUTOMATION.CHANGE_OPEN_ON_GITHUB')
                  : t('AUTOMATION.CHANGE_SENT_BRANCH', { branch: change.branch }),
          },
    canStop: isWorking,
    stopLabel: t('AUTOMATION.CHANGE_STOP'),
    onStop: props.onStop,
    canReview: canSend,
    reviewLabel: t('AUTOMATION.CHANGE_REVIEW'),
    onReview: props.onReview,
    canDiscard: change.status === 'ready' || change.status === 'app-bug' || canEnd,
    discardLabel: t('AUTOMATION.CHANGE_DISCARD'),
    onDiscard: props.onDiscard,
    canRetry: canEnd,
    retryLabel: t('AUTOMATION.CHANGE_RETRY'),
    onRetry: props.onRetry,
  };
};
