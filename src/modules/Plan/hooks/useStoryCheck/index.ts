import type { StoryAnswers } from '@/shared/types';
import { STORY_READ } from '@/modules/Plan/constants';
import {
  doubtsWithAnswers,
  isReadyStatus,
  waitingDoubtsOf,
} from '@/modules/Plan/library';
import { Jira } from '@/services';
import { useAppStore, useSetupStore, useWorkspaceStore } from '@/store';

export const useStoryCheck = () => {
  const check = async (props: {
    workspaceId: string;
    isForced?: boolean;
  }): Promise<StoryAnswers | null> => {
    const { workspaces, storyReadAt, markStoryRead, setDoubts, setStoryStage } =
      useWorkspaceStore.getState();
    const workspace = workspaces.find(({ id }) => id === props.workspaceId);
    const issue = workspace?.issue ?? null;
    const waiting = waitingDoubtsOf(workspace?.doubts ?? []);
    const ready =
      useAppStore.getState().projects.find(({ id }) => id === workspace?.projectId)
        ?.readyStatuses ?? [];
    const isAhead = workspace?.storyStage === 'ahead' && ready.length > 0;
    const now = Date.now();
    const isJiraConnected = useSetupStore
      .getState()
      .integrations.some(({ id }) => id === 'jira');

    if (!isJiraConnected || issue?.source !== 'jira') return null;

    if (waiting.length === 0 && !isAhead) return null;

    if (
      props.isForced !== true &&
      now - (storyReadAt[props.workspaceId] ?? 0) < STORY_READ.everyMs
    )
      return null;

    markStoryRead({ workspaceId: props.workspaceId, at: now });

    const [answers, status] = await Promise.all([
      waiting.length === 0
        ? Promise.resolve(null)
        : Jira.answers({ key: issue.key, doubts: waiting }),
      isAhead ? Jira.status(issue.key) : Promise.resolve(null),
    ]);

    if (answers?.isRead === true && answers.answers.length > 0) {
      const doubts =
        useWorkspaceStore.getState().workspaces.find(({ id }) => id === props.workspaceId)
          ?.doubts ?? [];

      setDoubts({
        workspaceId: props.workspaceId,
        doubts: doubtsWithAnswers({ doubts, answers: answers.answers }),
      });
    }

    if (status?.isRead === true && isReadyStatus({ status: status.status, ready }))
      setStoryStage({ workspaceId: props.workspaceId, stage: 'arrived' });

    return answers;
  };

  return { check };
};
