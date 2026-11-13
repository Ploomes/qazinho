import type { IPlanDoubtsProps } from '@/modules/Plan/screens/Plan/components/PlanDoubts/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatAgent } from '@/modules/Chat';
import { useStoryCheck } from '@/modules/Plan/hooks/useStoryCheck';
import {
  doubtsTextsOf,
  doubtsWithSent,
  heldDoubtsOf,
  planWithoutDoubt,
  waitingDoubtsOf,
} from '@/modules/Plan/library';
import { JIRA_FAILURE_KEYS } from '@/modules/Setup/constants';
import { templateFor } from '@/modules/Template/library';
import {
  useAppStore,
  useAssistantStore,
  useSettingsStore,
  useSetupStore,
  useTemplateStore,
  useWorkspaceStore,
} from '@/store';

export const usePlanDoubtsViewModel = (props: IPlanDoubtsProps) => {
  const { workspaceId, doubts, issue, plan, isLocked } = props;
  const { t, i18n } = useTranslation();
  const { check } = useStoryCheck();
  const { askAgent } = useChatAgent();
  const projectId = useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === workspaceId)?.projectId ?? null,
  );
  const chosen = useAppStore(
    (state) => state.projects.find(({ id }) => id === projectId)?.templates,
  );
  const templates = useTemplateStore((state) => state.templates);
  const planName = useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === workspaceId)?.name ?? '',
  );
  const isJiraConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'jira'),
  );
  const isAgentAnswering = useWorkspaceStore((state) =>
    state.askingIds.includes(workspaceId),
  );
  const setDoubts = useWorkspaceStore((state) => state.setDoubts);
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const say = useAssistantStore((state) => state.say);
  const closeAssistant = useAssistantStore((state) => state.close);
  const selectSettingsTab = useSettingsStore((state) => state.selectTab);
  const openSettings = useAppStore((state) => state.openSettings);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isReading, setReading] = useState(false);
  const [notice, setNotice] = useState<{
    workspaceId: string;
    text: string;
    url: string | null;
    isFailed: boolean;
  } | null>(null);

  useEffect(() => {
    void check({ workspaceId });
  }, [workspaceId, check]);

  const isOnJira = issue?.source === 'jira';
  const storyKey = issue?.key ?? '';
  const unsent = doubts.filter(({ sent }) => sent === null);
  const held = heldDoubtsOf({ plan, doubts });
  const heldIds = new Intl.ListFormat(i18n.language, {
    style: 'long',
    type: 'conjunction',
  }).format(held.map(({ id }) => id));
  const shownNotice = notice?.workspaceId === workspaceId ? notice : null;
  const stateOf = (doubt: (typeof doubts)[number]): { text: string; icon: IconName } => {
    if (doubt.answer !== null)
      return {
        text:
          doubt.answer.by === ''
            ? t('PLAN.DOUBT_ANSWERED_ANYONE')
            : t('PLAN.DOUBT_ANSWERED', { who: doubt.answer.by }),
        icon: 'passed',
      };

    return doubt.sent === null
      ? { text: t('PLAN.DOUBT_UNSENT'), icon: 'idle' }
      : { text: t('PLAN.DOUBT_SENT'), icon: 'pending' };
  };

  const doubtsTemplate = templateFor({
    kind: 'doubts',
    chosen,
    templates,
    orgDefault: null,
  });
  const doubtsTexts =
    doubtsTemplate === null
      ? null
      : doubtsTextsOf({
          template: doubtsTemplate,
          values: { story: storyKey, plan: planName },
        });

  return {
    isShown: doubts.length > 0,
    title: t('PLAN.DOUBTS'),
    rows: doubts.map((doubt) => {
      const state = stateOf(doubt);

      return {
        id: doubt.id,
        question: doubt.question,
        answer: doubt.answer?.text ?? null,
        state: state.text,
        icon: state.icon,
        url: doubt.sent?.url ?? null,
        openLabel: t('PLAN.DOUBT_OPEN'),
        canRemove: doubt.sent === null && !isLocked,
        removeLabel: t('PLAN.DOUBT_REMOVE', { id: doubt.id }),
      };
    }),
    canSend: isOnJira && unsent.length > 0 && !isLocked,
    sendLabel: t('PLAN.DOUBTS_SEND'),
    canRead: isOnJira && waitingDoubtsOf(doubts).length > 0,
    isReading,
    readLabel: isReading ? t('PLAN.DOUBTS_READING') : t('PLAN.DOUBTS_READ'),
    held:
      held.length === 0 || isLocked
        ? null
        : {
            text: t('PLAN.DOUBTS_HELD', { ids: heldIds }),
            applyLabel: t('PLAN.DOUBTS_APPLY'),
            canApply: !isAgentAnswering,
          },
    notice: shownNotice,
    closeLabel: t('COMMON.CLOSE'),
    isModalOpen,
    storyKey,
    unsent,
    texts: doubtsTexts,
    onSend: () => {
      if (isJiraConnected) {
        setModalOpen(true);

        return;
      }

      say(t('PLAN.TIP_JIRA_DOUBTS'));
      closeAssistant();
      selectSettingsTab('connections');
      openSettings();
    },
    onCancelModal: () => {
      setModalOpen(false);
    },
    onPosted: (posted: {
      sent: { url: string; at: string };
      questions: { id: string; question: string }[];
    }) => {
      setDoubts({ workspaceId, doubts: doubtsWithSent({ doubts, ...posted }) });
      setModalOpen(false);
      setNotice({
        workspaceId,
        text: t('PLAN.DOUBTS_POSTED', { key: storyKey }),
        url: posted.sent.url,
        isFailed: false,
      });
    },
    onRead: () => {
      if (isReading) return;

      setReading(true);
      void check({ workspaceId, isForced: true }).then((said) => {
        setReading(false);

        if (said === null) return;

        if (!said.isRead)
          setNotice({
            workspaceId,
            text: t(JIRA_FAILURE_KEYS[said.failure]),
            url: null,
            isFailed: true,
          });
        else if (said.answers.length === 0)
          setNotice({
            workspaceId,
            text: t('PLAN.DOUBTS_NO_ANSWERS', { key: storyKey }),
            url: null,
            isFailed: false,
          });
        else setNotice(null);
      });
    },
    onApply: () => {
      if (held.length === 0 || isAgentAnswering || isLocked) return;

      const text = t('PLAN.DOUBTS_APPLY_MESSAGE', { ids: heldIds });

      sendMessage({ workspaceId, text, mentions: [] });
      askAgent({
        workspaceId,
        text,
        references: [],
        code: null,
        jira: null,
        confluence: null,
      });
      selectTab('chat');
    },
    onRemove: (id: string) => {
      if (isLocked) return;

      setDoubts({ workspaceId, doubts: doubts.filter((doubt) => doubt.id !== id) });

      if (plan.some(({ blockedBy }) => blockedBy?.includes(id) === true))
        setPlan({ workspaceId, plan: planWithoutDoubt({ plan, id }) });
    },
    onDismissNotice: () => {
      setNotice(null);
    },
  };
};
