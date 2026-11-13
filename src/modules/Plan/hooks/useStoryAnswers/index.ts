import type { StoryAnswers } from '@/shared/types';
import { STORY_READ } from '@/modules/Plan/constants';
import { doubtsWithAnswers, waitingDoubtsOf } from '@/modules/Plan/library';
import { Jira } from '@/services';
import { useSetupStore, useWorkspaceStore } from '@/store';

export const useStoryAnswers = () => {
  const read = async (props: {
    workspaceId: string;
    isForced?: boolean;
  }): Promise<StoryAnswers | null> => {
    const { workspaces, storyReadAt, markStoryRead, setDoubts } =
      useWorkspaceStore.getState();
    const workspace = workspaces.find(({ id }) => id === props.workspaceId);
    const issue = workspace?.issue ?? null;
    const waiting = waitingDoubtsOf(workspace?.doubts ?? []);
    const now = Date.now();
    const isJiraConnected = useSetupStore
      .getState()
      .integrations.some(({ id }) => id === 'jira');

    if (!isJiraConnected || issue?.source !== 'jira' || waiting.length === 0) return null;

    if (
      props.isForced !== true &&
      now - (storyReadAt[props.workspaceId] ?? 0) < STORY_READ.everyMs
    )
      return null;

    markStoryRead({ workspaceId: props.workspaceId, at: now });

    const answers = await Jira.answers({ key: issue.key, doubts: waiting });

    if (answers.isRead && answers.answers.length > 0) {
      const doubts =
        useWorkspaceStore.getState().workspaces.find(({ id }) => id === props.workspaceId)
          ?.doubts ?? [];

      setDoubts({
        workspaceId: props.workspaceId,
        doubts: doubtsWithAnswers({ doubts, answers: answers.answers }),
      });
    }

    return answers;
  };

  return { read };
};
