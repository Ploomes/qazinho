import type { IKeybind } from '@/modules/Settings/types';

export const KEYBINDS: IKeybind[] = [
  { id: 'search', labelKey: 'SETTINGS.KEYBIND_SEARCH', combo: '⌘K' },
  { id: 'workspace', labelKey: 'SETTINGS.KEYBIND_WORKSPACE', combo: '⌘N' },
  { id: 'run', labelKey: 'SETTINGS.KEYBIND_RUN', combo: '⌘↵' },
  { id: 'stop', labelKey: 'SETTINGS.KEYBIND_STOP', combo: '⌘.' },
  { id: 'device', labelKey: 'SETTINGS.KEYBIND_DEVICE', combo: '⌘\\' },
  { id: 'sidebar', labelKey: 'SETTINGS.KEYBIND_SIDEBAR', combo: '⌘B' },
  { id: 'chat', labelKey: 'SETTINGS.KEYBIND_AGENT', combo: '⌘1' },
  { id: 'plan', labelKey: 'SETTINGS.KEYBIND_PLAN', combo: '⌘2' },
  { id: 'runs', labelKey: 'SETTINGS.KEYBIND_RUNS', combo: '⌘3' },
  { id: 'bugs', labelKey: 'SETTINGS.KEYBIND_BUGS', combo: '⌘4' },
  { id: 'assistant', labelKey: 'SETTINGS.KEYBIND_ASSISTANT', combo: '⌘J' },
  { id: 'resources', labelKey: 'SETTINGS.KEYBIND_RESOURCES', combo: '⌘R' },
  { id: 'settings', labelKey: 'SETTINGS.KEYBIND_SETTINGS', combo: '⌘,' },
];
