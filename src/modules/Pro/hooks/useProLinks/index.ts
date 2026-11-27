import type { IProLink } from '@/shared/types';
import { useEffect, useEffectEvent } from 'react';
import { Pro } from '@/services';
import { useAppStore, useProStore, useWorkspaceStore } from '@/store';

export const useProLinks = (isOn: boolean) => {
  const isLoaded = useWorkspaceStore((state) => state.isLoaded);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const setLink = useProStore((state) => state.setLink);

  const open = useEffectEvent((link: IProLink | null) => {
    if (link === null) return;

    const isHere = useWorkspaceStore
      .getState()
      .workspaces.some(({ id }) => id === link.workspaceId);

    if (!isHere) {
      setLink(link);

      return;
    }

    selectWorkspace(link.workspaceId);
    selectTab('plan');
  });

  useEffect(() => {
    if (!isOn || !isLoaded) return undefined;

    void Pro.takeLink().then(open);

    return Pro.onLink(() => {
      void Pro.takeLink().then(open);
    });
  }, [isOn, isLoaded]);
};
