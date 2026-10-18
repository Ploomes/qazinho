import type { IKeybind } from '@/modules/Settings/types';

export const KEYBINDS: IKeybind[] = [
  { id: 'workspace', labelKey: 'SETTINGS.KEYBIND_WORKSPACE', combo: '⌘N' },
  { id: 'run', labelKey: 'SETTINGS.KEYBIND_RUN', combo: '⌘↵' },
  { id: 'stop', labelKey: 'SETTINGS.KEYBIND_STOP', combo: '⌘.' },
  { id: 'device', labelKey: 'SETTINGS.KEYBIND_DEVICE', combo: '⌘\\' },
  { id: 'chat', labelKey: 'SETTINGS.KEYBIND_CHAT', combo: '⌘1' },
  { id: 'plan', labelKey: 'SETTINGS.KEYBIND_PLAN', combo: '⌘2' },
  { id: 'runs', labelKey: 'SETTINGS.KEYBIND_RUNS', combo: '⌘3' },
  { id: 'bugs', labelKey: 'SETTINGS.KEYBIND_BUGS', combo: '⌘4' },
  { id: 'resources', labelKey: 'SETTINGS.KEYBIND_RESOURCES', combo: '⌘R' },
  { id: 'settings', labelKey: 'SETTINGS.KEYBIND_SETTINGS', combo: '⌘,' },
];
