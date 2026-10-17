import { useEffect } from 'react';
import { useRunControls } from '@/modules/Run';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';
import { comboOf } from './library';

/** The one place a key becomes an action. What each key does is the QA's to change. */
export const useKeybinds = () => {
  const keybinds = useSettingsStore((state) => state.keybinds);
  const editingKeybindId = useSettingsStore((state) => state.editingKeybindId);
  const setKeybind = useSettingsStore((state) => state.setKeybind);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const openWorkspaceModal = useAppStore((state) => state.openWorkspaceModal);
  const openSettings = useAppStore((state) => state.openSettings);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const toggleDevicePanel = useWorkspaceStore((state) => state.toggleDevicePanel);
  const { onRun, onStop } = useRunControls();

  useEffect(() => {
    const doing: Record<string, () => void> = {
      workspace: () => {
        if (selectedProjectId !== null) openWorkspaceModal(selectedProjectId);
      },
      run: onRun,
      stop: onStop,
      device: toggleDevicePanel,
      chat: () => {
        selectTab('chat');
      },
      plan: () => {
        selectTab('plan');
      },
      runs: () => {
        selectTab('runs');
      },
      bugs: () => {
        selectTab('bugs');
      },
      resources: toggleResources,
      settings: openSettings,
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const combo = comboOf(event);

      if (combo === null) return;

      if (editingKeybindId !== null) {
        event.preventDefault();
        setKeybind({ keybindId: editingKeybindId, combo });

        return;
      }

      const bound = keybinds.find((keybind) => keybind.combo === combo);
      const act = bound === undefined ? undefined : doing[bound.id];

      if (act === undefined) return;

      event.preventDefault();
      act();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    keybinds,
    editingKeybindId,
    setKeybind,
    selectedProjectId,
    openWorkspaceModal,
    openSettings,
    toggleResources,
    selectTab,
    toggleDevicePanel,
    onRun,
    onStop,
  ]);
};
