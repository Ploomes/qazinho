import { useEffect } from 'react';
import { useRunActions } from '@/modules/Run';
import {
  useAppStore,
  useAssistantStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';
import { comboOf, isBindable } from './library';

export const useKeybinds = () => {
  const keybinds = useSettingsStore((state) => state.keybinds);
  const editingKeybindId = useSettingsStore((state) => state.editingKeybindId);
  const setKeybind = useSettingsStore((state) => state.setKeybind);
  const editKeybind = useSettingsStore((state) => state.editKeybind);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const openWorkspaceModal = useAppStore((state) => state.openWorkspaceModal);
  const openSettings = useAppStore((state) => state.openSettings);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const toggleDevicePanel = useWorkspaceStore((state) => state.toggleDevicePanel);
  const hasOnboarded = useSettingsStore((state) => state.hasOnboarded);
  const toggleAssistant = useAssistantStore((state) => state.toggle);
  const { onRun, onStop } = useRunActions();

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
      assistant: () => {
        if (hasOnboarded) toggleAssistant();
      },
      resources: toggleResources,
      settings: openSettings,
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const combo = comboOf(event);

      if (combo === null) return;

      if (editingKeybindId !== null) {
        event.preventDefault();

        if (event.key === 'Escape') editKeybind(null);
        else if (isBindable(combo)) setKeybind({ keybindId: editingKeybindId, combo });

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
    editKeybind,
    selectedProjectId,
    openWorkspaceModal,
    openSettings,
    toggleResources,
    selectTab,
    toggleDevicePanel,
    hasOnboarded,
    toggleAssistant,
    onRun,
    onStop,
  ]);
};
