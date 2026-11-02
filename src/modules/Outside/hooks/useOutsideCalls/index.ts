import type { IOutsidePort } from '@/modules/Outside/types';
import { useEffect } from 'react';
import { performOutsideTool } from '@/modules/Outside/library';
import { useRunActions } from '@/modules/Run';
import { Outside, Run } from '@/services';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useOutsideCalls = () => {
  const { beginRun, stopWorkspace } = useRunActions();

  useEffect(() => {
    const port: IOutsidePort = {
      read: () => ({
        isLoaded: useAppStore.getState().isLoaded,
        projects: useAppStore.getState().projects,
        workspaces: useWorkspaceStore.getState().workspaces,
      }),
      now: () => Date.now(),
      startRun: beginRun,
      stopWorkspace,
      waitForRun: ({ workspaceId, ms }) =>
        new Promise((done) => {
          const hasSettled = () => {
            const live = useWorkspaceStore
              .getState()
              .workspaces.find(({ id }) => id === workspaceId)?.live;

            return !live || live.isDone || live.question !== undefined;
          };

          if (hasSettled()) {
            done();

            return;
          }

          const finish = () => {
            clearTimeout(timer);
            stopWatching();
            done();
          };
          const timer = setTimeout(finish, ms);
          const stopWatching = useWorkspaceStore.subscribe(() => {
            if (hasSettled()) finish();
          });
        }),
      networkOf: (run) => Run.network(run),
      suggestCases: (suggestion) => {
        useWorkspaceStore.getState().suggestCases(suggestion);
      },
    };

    return Outside.onCall(({ id, call }) => {
      void performOutsideTool({ call, port })
        .catch((reason: unknown) => ({
          text: `QAzinho could not do it: ${reason instanceof Error ? reason.message : String(reason)}`,
          isError: true,
        }))
        .then(({ text, isError }) => {
          Outside.answer({ id, text, isError });
        });
    });
  }, [beginRun, stopWorkspace]);
};
