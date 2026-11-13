import type { IPlanChangesProps } from '@/modules/Plan/screens/Plan/components/PlanChanges/types';
import type { ITestCase, RefusalReason, ReviewItem } from '@/modules/Plan/types';
import type { IDraftedCase, ISourceChange } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { nextDoubtIdsOf } from '@/modules/Chat';
import {
  caseIdsUsed,
  changeBriefOf,
  doubtsWithAnswers,
  planWithItem,
  reviewOf,
  storyNoteOf,
} from '@/modules/Plan/library';
import { REFUSALS } from '@/modules/Plan/screens/Plan/components/PlanChanges/constants';
import { Sources } from '@/services';
import { useSourceCheck } from '@/shared/hooks/useSourceCheck';
import { useMachineStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const usePlanChangesViewModel = (props: IPlanChangesProps) => {
  const { workspaceId, plan, doubts, issue, changed, review, isLocked } = props;
  const { t, i18n } = useTranslation();
  const { check } = useSourceCheck();
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const setDoubts = useWorkspaceStore((state) => state.setDoubts);
  const setReview = useWorkspaceStore((state) => state.setReview);
  const resolveChanges = useWorkspaceStore((state) => state.resolveChanges);
  const language = useSettingsStore((state) => state.language);
  const agentName = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const agents = useMachineStore((state) => state.agents);
  const [isChecking, setChecking] = useState(false);
  const [isProposing, setProposing] = useState(false);
  const [refusingId, setRefusingId] = useState<string | null>(null);
  const [isTelling, setTelling] = useState(false);
  const [notice, setNotice] = useState<{
    workspaceId: string;
    text: string;
    url: string | null;
  } | null>(null);

  const listOf = (names: string[]) =>
    new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' }).format(
      names,
    );
  const say = (text: string, url: string | null = null) => {
    setNotice({ workspaceId, text, url });
  };
  const lineOf = (change: ISourceChange) => {
    if (change.kind === 'page') return t('PLAN.CHANGED_PAGE', { title: change.title });

    if (change.kind === 'code') return t('PLAN.CHANGED_CODE', { branch: change.branch });

    if (change.kind === 'meeting')
      return t('PLAN.CHANGED_MEETING', { name: change.name });

    return change.before.replace(/\s+/g, ' ').trim() !==
      change.after.replace(/\s+/g, ' ').trim() || change.comments.length === 0
      ? t('PLAN.CHANGED_STORY', { key: change.key })
      : t(
          change.comments.length === 1
            ? 'PLAN.CHANGED_STORY_COMMENTS_ONE'
            : 'PLAN.CHANGED_STORY_COMMENTS_OTHER',
          { key: change.key, count: change.comments.length },
        );
  };
  const stepsOf = (drafted: Pick<IDraftedCase, 'steps'> | undefined) =>
    (drafted?.steps ?? []).map(
      ({ action, expected }, index) =>
        `${String(index + 1)}. ${action}${expected === '' ? '' : ` → ${expected}`}`,
    );
  const decide = (decided: {
    id: string;
    state: ReviewItem['state'];
    refusal?: RefusalReason;
  }) => {
    if (review === null) return;

    setReview({
      workspaceId,
      review: {
        ...review,
        items: review.items.map((item) =>
          item.id === decided.id
            ? {
                ...item,
                state: decided.state,
                ...(decided.refusal === undefined ? {} : { refusal: decided.refusal }),
              }
            : item,
        ),
      },
    });
  };
  const applied = (items: ReviewItem[]) => {
    const workspace = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === workspaceId);
    let next: ITestCase[] = plan;
    let nextDoubts = doubts;

    for (const item of items) {
      if (item.kind === 'doubt') {
        const [id] = nextDoubtIdsOf({ doubts: nextDoubts, count: 1 });

        if (id !== undefined)
          nextDoubts = [
            ...nextDoubts,
            { id, question: item.question, sent: null, answer: null },
          ];
      } else
        next = planWithItem({
          plan: next,
          item,
          used: workspace === undefined ? [] : caseIdsUsed(workspace),
        });
    }

    if (next !== plan) setPlan({ workspaceId, plan: next });

    if (nextDoubts !== doubts) setDoubts({ workspaceId, doubts: nextDoubts });
  };
  const open = review?.items.filter(({ state }) => state === 'open') ?? [];
  const isDone = review !== null && open.length === 0;
  const shownNotice = notice?.workspaceId === workspaceId ? notice : null;
  const canTellOf = () =>
    isDone &&
    issue?.source === 'jira' &&
    (review?.items.some(({ state }) => state === 'applied') ?? false);

  return {
    canCheck: props.canCheck && changed === null && review === null && !isLocked,
    isChecking,
    checkLabel: isChecking ? t('PLAN.CHECKING_CHANGES') : t('PLAN.CHECK_CHANGES'),
    notice: shownNotice,
    closeLabel: t('COMMON.CLOSE'),
    changedLines: review === null ? (changed?.found.map(lineOf) ?? []) : [],
    canPropose: changed !== null && review === null && !isLocked,
    isProposing,
    proposeLabel: isProposing ? t('PLAN.PROPOSING') : t('PLAN.PROPOSE'),
    keepLabel: t('PLAN.KEEP_PLAN'),
    hasReview: review !== null,
    summary: review?.summary ?? '',
    nowLabel: t('PLAN.REVIEW_NOW'),
    thenLabel: t('PLAN.REVIEW_THEN'),
    items: (review?.items ?? []).map((item) => {
      const kept =
        item.kind === 'change' ? plan.find(({ id }) => id === item.caseId) : undefined;
      const before = item.kind === 'change' ? stepsOf(kept) : [];
      const after = item.kind === 'doubt' ? [] : stepsOf(item.case);

      return {
        id: item.id,
        kind: item.kind,
        title:
          item.kind === 'doubt'
            ? t('PLAN.REVIEW_DOUBT')
            : item.kind === 'add'
              ? `${t('PLAN.REVIEW_NEW')}: ${item.case.title}`
              : `${item.caseId} ${kept?.title ?? item.case.title}`,
        text:
          item.kind === 'doubt' ? item.question : t('PLAN.REVIEW_WHY', { why: item.why }),
        before,
        after: after.map((line) => ({
          line,
          isChanged: item.kind === 'change' && !before.includes(line),
        })),
        isOpen: item.state === 'open' && !isLocked,
        state:
          item.state === 'applied'
            ? t('PLAN.REVIEW_APPLIED')
            : item.state === 'refused'
              ? t('PLAN.REVIEW_REFUSED')
              : '',
        applyLabel:
          item.kind === 'change' ? t('PLAN.REVIEW_APPLY') : t('PLAN.REVIEW_ADD'),
        refuseLabel: t('PLAN.REVIEW_REFUSE'),
        isRefusing: refusingId === item.id,
        refusals: REFUSALS.map(({ reason, labelKey }) => ({
          reason,
          label: t(labelKey),
        })),
      };
    }),
    canApplyAll: open.length > 1 && !isLocked,
    applyAllLabel: t('PLAN.REVIEW_APPLY_ALL'),
    isDone,
    canTell: canTellOf(),
    tellLabel: t('PLAN.TELL_STORY'),
    doneLabel: t('PLAN.REVIEW_DONE'),
    doneVariant: canTellOf() ? ('ghost' as const) : ('primary' as const),
    isTelling,
    storyKey: issue?.key ?? '',
    note:
      review === null
        ? ''
        : storyNoteOf({
            review,
            plan,
            words: {
              intro: (summary) => t('PLAN.NOTE_INTRO', { summary }),
              changed: (one) => t('PLAN.NOTE_CHANGED', one),
              added: (title) => t('PLAN.NOTE_ADDED', { title }),
              doubt: (question) => t('PLAN.NOTE_DOUBT', { question }),
            },
          }),
    onCheck: () => {
      if (isChecking) return;

      setChecking(true);
      void check(workspaceId).then((checked) => {
        setChecking(false);

        if (checked === null || checked.changes.length > 0) {
          setNotice(null);

          return;
        }

        say(
          checked.missed.length === 0
            ? t('PLAN.CHANGES_NONE')
            : t('PLAN.CHANGES_MISSED', { names: listOf(checked.missed) }),
        );
      });
    },
    onPropose: () => {
      if (changed === null || isProposing || isLocked) return;

      setProposing(true);
      setNotice(null);
      void Sources.read({
        workspaceId,
        agentId: agents.find(({ name }) => name === agentName)?.id ?? 'claude-code',
        model,
        brief: changeBriefOf({ changed, plan, doubts, language }),
      }).then((reading) => {
        setProposing(false);

        if (!reading.isRead) {
          say(
            reading.reason === 'agent-missing'
              ? t('PLAN.PROPOSE_NO_AGENT')
              : t('PLAN.PROPOSE_UNANSWERED'),
          );

          return;
        }

        if (reading.read.answered.length > 0)
          setDoubts({
            workspaceId,
            doubts: doubtsWithAnswers({
              doubts,
              answers: reading.read.answered.map(({ doubtId, text }) => ({
                doubtId,
                text,
                by: '',
                at: new Date().toISOString(),
              })),
            }),
          });

        const proposed = reviewOf({ read: reading.read, at: new Date().toISOString() });

        if (proposed.items.length === 0) {
          resolveChanges(workspaceId);
          say(
            reading.read.summary === '' ? t('PLAN.REVIEW_NOTHING') : reading.read.summary,
          );

          return;
        }

        setReview({ workspaceId, review: proposed });
      });
    },
    onKeep: () => {
      if (!isLocked) resolveChanges(workspaceId);
    },
    onApply: (id: string) => {
      const item = review?.items.find((one) => one.id === id);

      if (item === undefined || item.state !== 'open' || isLocked) return;

      applied([item]);
      decide({ id, state: 'applied' });
    },
    onRefuse: (id: string) => {
      setRefusingId(refusingId === id ? null : id);
    },
    onRefusal: (refused: { id: string; reason: RefusalReason }) => {
      setRefusingId(null);
      decide({ id: refused.id, state: 'refused', refusal: refused.reason });
    },
    onApplyAll: () => {
      if (review === null || isLocked) return;

      applied(open);
      setReview({
        workspaceId,
        review: {
          ...review,
          items: review.items.map((item) =>
            item.state === 'open' ? { ...item, state: 'applied' } : item,
          ),
        },
      });
    },
    onTell: () => {
      setTelling(true);
    },
    onCancelTell: () => {
      setTelling(false);
    },
    onTold: (url: string) => {
      setTelling(false);
      resolveChanges(workspaceId);
      say(t('PLAN.TELL_POSTED', { key: issue?.key ?? '' }), url);
    },
    onDone: () => {
      resolveChanges(workspaceId);
    },
    onDismissNotice: () => {
      setNotice(null);
    },
  };
};
