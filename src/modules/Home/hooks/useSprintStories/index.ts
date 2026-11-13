import type { ISprintRead } from '@/modules/Home/types';
import { useEffect, useState } from 'react';
import { Jira } from '@/services';
import { useAppStore, useSetupStore } from '@/store';

export const useSprintStories = (): Record<string, ISprintRead> => {
  const isJiraConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'jira'),
  );
  const boards = useAppStore((state) =>
    state.projects
      .flatMap(({ id, readyColumn }) =>
        readyColumn === undefined ? [] : [`${String(readyColumn.boardId)} ${id}`],
      )
      .join('\n'),
  );
  const [sprints, setSprints] = useState<Record<string, ISprintRead>>({});

  useEffect(() => {
    if (!isJiraConnected || boards === '') return;

    for (const line of boards.split('\n')) {
      const [board = '', projectId = ''] = line.split(' ');

      void Jira.sprint(Number(board)).then((read) => {
        if (read.isListed)
          setSprints((before) => ({
            ...before,
            [projectId]: { sprint: read.sprint, stories: read.stories },
          }));
      });
    }
  }, [boards, isJiraConnected]);

  return isJiraConnected ? sprints : {};
};
