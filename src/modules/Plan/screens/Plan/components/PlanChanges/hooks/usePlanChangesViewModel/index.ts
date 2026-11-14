import type { IPlanChangesProps } from '@/modules/Plan/screens/Plan/components/PlanChanges/types';
import type {
  IPendingChange,
  ITestCase,
  RefusalReason,
  ReviewItem,
} from '@/modules/Plan/types';
import type { IDraftedCase, ISourceChange } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { nextDoubtIdsOf } from '@/modules/Chat';
import {
  caseIdsUsed,
  changeBriefOf,
  changeNameOf,
  doubtsWithAnswers,
  doubtsWithSent,
  lineDiffOf,
  planWithItem,
  reviewDoubtsOf,
  reviewOf,
  storyNoteOf,
} from '@/modules/Plan/library';
import { REFUSALS } from '@/modules/Plan/screens/Plan/components/PlanChanges/constants';
import { templateFor } from '@/modules/Template/library';
import { Sources } from '@/services';
import { useSourceCheck } from '@/shared/hooks/useSourceCheck';
import {
  useAppStore,
  useMachineStore,
  useProStore,
  useSettingsStore,
  useTemplateStore,
  useWorkspaceStore,
} from '@/store';

export const usePlanChangesViewModel = (props: IPlanChangesProps) => {
  const { workspaceId, plan, doubts, issue, changed, review, isLocked } = props;
  const { t, i18n } = useTranslation();
  const { check } = useSourceCheck();
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const setDoubts = useWorkspaceStore((state) => state.setDoubts);
  const setReview = useWorkspaceStore((state) => state.setReview);
  const setChanged = useWorkspaceStore((state) => state.setChanged);
  const resolveChanges = useWorkspaceStore((state) => state.resolveChanges);
  const addTold = useWorkspaceStore((state) => state.addTold);
  const language = useSettingsStore((state) => state.language);
  const agentName = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const agents = useMachineStore((state) => state.agents);
  const templates = useTemplateStore((state) => state.templates);
  const projects = useAppStore((state) => state.projects);
  const workspaceNow = useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === workspaceId) ?? null,
  );
  const orgSlug = useProStore(
    (state) =>
      state.shares.find(({ projectId }) => projectId === workspaceNow?.projectId)
        ?.orgSlug,
  );
  const org = useTemplateStore((state) =>
    state.orgTemplates.find((one) => one.orgSlug === orgSlug),
  );
  const [isChecking, setChecking] = useState(false);
  const [isProposing, setProposing] = useState(false);
  const [refusingId, setRefusingId] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [otherNote, setOtherNote] = useState('');
  const [isTelling, setTelling] = useState(false);
  const [isMeeting, setMeeting] = useState(false);
  const [isShowingDetail, setShowingDetail] = useState(false);
  const [notice, setNotice] = useState<{
    workspaceId: string;
    text: string;
    url: string | null;
    isCheck: boolean;
  } | null>(null);

  const listOf = (names: string[]) =>
    new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' }).format(
      names,
    );
  const say = (text: string, url: string | null = null) => {
    setNotice({ workspaceId, text, url, isCheck: false });
  };
  const lineOf = (change: ISourceChange) => {
    if (change.kind === 'page') return t('PLAN.CHANGED_PAGE', { title: change.title });

    if (change.kind === 'code') return t('PLAN.CHANGED_CODE', { branch: change.branch });

    if (change.kind === 'meeting')
      return t('PLAN.CHANGED_MEETING', { name: change.name });

    const isTextChanged =
      change.before.replace(/\s+/g, ' ').trim() !==
      change.after.replace(/\s+/g, ' ').trim();
    const count = change.comments.length;

    if (count === 0) return t('PLAN.CHANGED_STORY', { key: change.key });

    return isTextChanged
      ? t(count === 1 ? 'PLAN.CHANGED_STORY_BOTH_ONE' : 'PLAN.CHANGED_STORY_BOTH_OTHER', {
          key: change.key,
          count,
        })
      : t(
          count === 1
            ? 'PLAN.CHANGED_STORY_COMMENTS_ONE'
            : 'PLAN.CHANGED_STORY_COMMENTS_OTHER',
          { key: change.key, count },
        );
  };
  const detailOf = (change: ISourceChange) => {
    if (change.kind === 'meeting') return { removed: [], added: [], said: [] };

    if (change.kind === 'code')
      return { removed: [], added: change.files.map(({ path }) => path), said: [] };

    return {
      ...lineDiffOf({ before: change.before, after: change.after }),
      said:
        change.kind === 'story'
          ? change.comments.map(({ author, text }) =>
              t('PLAN.CHANGED_SAID', { author, text: text.replace(/\s+/g, ' ').trim() }),
            )
          : [],
    };
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
    note?: string;
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
                ...(decided.note === undefined || decided.note.trim() === ''
                  ? {}
                  : { refusalNote: decided.note.trim() }),
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
  const propose = (asked: IPendingChange) => {
    if (isProposing || isLocked) return;

    setProposing(true);
    setNotice(null);
    void Sources.read({
      workspaceId,
      agentId: agents.find(({ name }) => name === agentName)?.id ?? 'claude-code',
      model,
      brief: changeBriefOf({ changed: asked, plan, doubts, language }),
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
            isAnyDoubt: true,
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
  };
  const meeting = changed?.found.find((one) => one.kind === 'meeting');
  const open = review?.items.filter(({ state }) => state === 'open') ?? [];
  const isDone = review !== null && open.length === 0;
  const shownNotice =
    notice?.workspaceId === workspaceId && !(notice.isCheck && changed !== null)
      ? notice
      : null;
  const stateOf = (item: ReviewItem) => {
    if (item.state === 'open') return '';

    if (item.state === 'refused') {
      const reason = REFUSALS.find(({ reason: one }) => one === item.refusal);
      const why = item.refusalNote ?? (reason === undefined ? '' : t(reason.labelKey));

      return why === ''
        ? t('PLAN.REVIEW_REFUSED')
        : t('PLAN.REVIEW_REFUSED_WHY', { why });
    }

    return item.kind === 'add'
      ? t('PLAN.REVIEW_ADDED')
      : item.kind === 'doubt'
        ? t('PLAN.REVIEW_DOUBT_ADDED')
        : t('PLAN.REVIEW_APPLIED');
  };
  const canTellOf = () =>
    isDone &&
    issue?.source === 'jira' &&
    (review?.items.some(({ state }) => state === 'applied') ?? false);

  const canCheck = props.canCheck && changed === null && review === null && !isLocked;
  const canMeet = plan.length > 0 && changed === null && review === null && !isLocked;

  const moreItems = [
    ...(canMeet
      ? [
          {
            key: 'meet',
            label: t('PLAN.READ_MEETING'),
            icon: 'file' as const,
            isDisabled: isProposing,
            onPick: () => {
              setMeeting(true);
            },
          },
        ]
      : []),
    ...props.more,
  ];

  return {
    hasBar: canCheck || canMeet || props.actions !== null || moreItems.length > 0,
    actions: props.actions,
    hasMore: moreItems.length > 0,
    moreLabel: t('PLAN.MORE'),
    moreItems,
    canCheck,
    isChecking,
    checkLabel: isChecking ? t('PLAN.CHECKING_CHANGES') : t('PLAN.CHECK_CHANGES'),
    notice: shownNotice,
    closeLabel: t('COMMON.CLOSE'),
    changes:
      review === null
        ? (changed?.found ?? []).map((change, index) => ({
            key: `${change.kind}-${String(index)}`,
            line: lineOf(change),
            ...detailOf(change),
          }))
        : [],
    hasDetail:
      review === null &&
      (changed?.found ?? []).some((change) => {
        const detail = detailOf(change);

        return detail.removed.length + detail.added.length + detail.said.length > 0;
      }),
    isShowingDetail,
    detailLabel: isShowingDetail ? t('PLAN.CHANGED_HIDE') : t('PLAN.CHANGED_SHOW'),
    removedLabel: t('PLAN.CHANGED_REMOVED'),
    addedLabel: t('PLAN.CHANGED_ADDED'),
    onDetail: () => {
      setShowingDetail(!isShowingDetail);
    },
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
        isDecided: item.state !== 'open',
        className:
          item.state === 'open'
            ? 'plan-changes__item'
            : 'plan-changes__item plan-changes__item--decided',
        state: stateOf(item),
        isOther: otherId === item.id,
        otherNote,
        otherLabel: t('PLAN.REVIEW_REFUSE_OTHER_LABEL'),
        otherConfirmLabel: t('PLAN.REVIEW_REFUSE'),
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
    isMentioning: review !== null && reviewDoubtsOf({ review, doubts }).length > 0,
    note:
      review === null
        ? ''
        : storyNoteOf({
            review,
            plan,
            words: {
              intro: (summary) =>
                meeting === undefined
                  ? t('PLAN.NOTE_INTRO', { summary })
                  : t('PLAN.NOTE_MEETING', { name: changeNameOf(meeting), summary }),
              changed: (one) => t('PLAN.NOTE_CHANGED', one),
              added: (title) => t('PLAN.NOTE_ADDED', { title }),
              doubt: ({ id, question }) =>
                id === ''
                  ? t('PLAN.NOTE_DOUBT', { question })
                  : t('PLAN.NOTE_DOUBT_ID', { id, question }),
            },
            doubts,
            template: templateFor({
              kind: 'decisions',
              chosen: projects.find(({ id }) => id === workspaceNow?.projectId)
                ?.templates,
              templates,
              org,
            }),
            values: {
              story: issue?.key ?? '',
              meeting: meeting === undefined ? '' : changeNameOf(meeting),
              plan: workspaceNow?.name ?? '',
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

        setNotice({
          workspaceId,
          text:
            checked.missed.length === 0
              ? t('PLAN.CHANGES_NONE')
              : t('PLAN.CHANGES_MISSED', { names: listOf(checked.missed) }),
          url: null,
          isCheck: true,
        });
      });
    },
    onPropose: () => {
      if (changed !== null && review === null) propose(changed);
    },
    canMeet,
    meetLabel: t('PLAN.READ_MEETING'),
    isMeeting,
    onMeet: () => {
      setMeeting(true);
    },
    onCancelMeeting: () => {
      setMeeting(false);
    },
    onMeeting: (meeting: { name: string; text: string }) => {
      const workspace = useWorkspaceStore
        .getState()
        .workspaces.find(({ id }) => id === workspaceId);
      const at = new Date().toISOString();
      const heard: IPendingChange = {
        found: [
          {
            kind: 'meeting',
            name: meeting.name,
            at: at.slice(0, 10),
            text: meeting.text,
          },
        ],
        snapshots: workspace?.snapshots ?? [],
        code: workspace?.planSource ?? null,
        at,
      };

      setMeeting(false);
      setChanged({ workspaceId, changed: heard });
      propose(heard);
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
      setOtherId(null);
      setOtherNote('');
    },
    onRefusal: (refused: { id: string; reason: RefusalReason }) => {
      if (refused.reason === 'other') {
        setOtherId(refused.id);

        return;
      }

      setRefusingId(null);
      decide({ id: refused.id, state: 'refused', refusal: refused.reason });
    },
    onOtherNote: setOtherNote,
    onOtherConfirm: (id: string) => {
      setRefusingId(null);
      setOtherId(null);
      decide({ id, state: 'refused', refusal: 'other', note: otherNote });
      setOtherNote('');
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
      const told = review === null ? [] : reviewDoubtsOf({ review, doubts });

      setTelling(false);

      if (told.length > 0)
        setDoubts({
          workspaceId,
          doubts: doubtsWithSent({
            doubts,
            sent: { url, at: new Date().toISOString() },
            questions: told,
          }),
        });

      addTold({ workspaceId, url });
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
