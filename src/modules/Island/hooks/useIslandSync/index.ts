import type { IslandState } from '@/shared/types';
import { useEffect, useRef, useState } from 'react';
import { ISLAND } from '@/modules/Island/constants';
import { endedStateOf, islandStateOf } from '@/modules/Island/library';
import { useRunActions } from '@/modules/Run';
import { Island } from '@/services';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const useIslandSync = () => {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const projects = useAppStore((state) => state.projects);
  const language = useSettingsStore((state) => state.language);
  const isIslandOn = useSettingsStore((state) => state.isIslandOn);
  const { stopWorkspace } = useRunActions();
  const [ended, setEnded] = useState<IslandState | null>(null);
  const [lastGoingId, setLastGoingId] = useState<string | null>(null);
  const sent = useRef('');
  const going = islandStateOf({ workspaces, projects });
  const goingId =
    going.kind === 'running'
      ? going.workspaceId
      : going.kind === 'asking'
        ? (going.questions[0]?.workspaceId ?? null)
        : null;
  const state: IslandState = !isIslandOn
    ? { kind: 'idle' }
    : going.kind !== 'idle'
      ? going
      : (ended ?? going);

  if (goingId !== lastGoingId) {
    const finished = workspaces.find(({ id }) => id === lastGoingId);

    setLastGoingId(goingId);
    setEnded(
      goingId === null && finished?.live?.isDone === true ? endedStateOf(finished) : null,
    );
  }

  useEffect(() => {
    if (ended === null) return;

    const hold = setTimeout(() => {
      setEnded(null);
    }, ISLAND.endedHoldMs);

    return () => {
      clearTimeout(hold);
    };
  }, [ended]);

  useEffect(() => {
    const payload = JSON.stringify({ language, state });

    if (payload === sent.current) return;

    sent.current = payload;
    Island.set({ language, state });
  });

  useEffect(
    () =>
      Island.onAction((action) => {
        if (action.kind === 'stop') stopWorkspace(action.workspaceId);

        if (action.kind === 'open') {
          useAppStore.getState().selectWorkspace(action.workspaceId);
          useWorkspaceStore.getState().selectTab('chat');
        }
      }),
    [stopWorkspace],
  );
};
