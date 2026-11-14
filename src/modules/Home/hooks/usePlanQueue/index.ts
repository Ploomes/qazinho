import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatAgent } from '@/modules/Chat';
import { PLAN_QUEUE } from '@/modules/Home/constants';
import { useWorkspaceStore } from '@/store';

export const usePlanQueue = () => {
  const { t } = useTranslation();
  const { askAgent } = useChatAgent();
  const next = useWorkspaceStore((state) => state.planQueue[0] ?? null);
  const working = useWorkspaceStore(
    (state) => state.planning.filter((id) => state.askingIds.includes(id)).length,
  );
  const takeQueued = useWorkspaceStore((state) => state.takeQueued);
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);

  useEffect(() => {
    if (working >= PLAN_QUEUE.atOnce || next === null) return;

    const issue = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === next)?.issue;

    takeQueued(next);

    if (issue === null || issue === undefined) return;

    const story = { key: issue.key, summary: issue.title, url: issue.url };
    const text = t('COMMANDS.JIRA_PLAN_SAY', { key: story.key, summary: story.summary });

    sendMessage({
      workspaceId: next,
      text,
      mentions: [],
      command: { id: 'jira-plan', ...story },
    });
    askAgent({
      workspaceId: next,
      text,
      references: [],
      code: null,
      jira: { key: story.key },
      confluence: null,
    });
  }, [working, next, takeQueued, sendMessage, askAgent, t]);
};
