import type { IKeybind } from '@/modules/Settings/types';

export const KEYBINDS: IKeybind[] = [
  { id: 'workspace', label: 'New workspace', combo: '⌘N' },
  { id: 'run', label: 'Run the plan', combo: '⌘↵' },
  { id: 'stop', label: 'Stop the run', combo: '⌘.' },
  { id: 'device', label: 'Show or hide the device', combo: '⌘\\' },
  { id: 'chat', label: 'Go to Chat', combo: '⌘1' },
  { id: 'plan', label: 'Go to Plan', combo: '⌘2' },
  { id: 'runs', label: 'Go to Runs', combo: '⌘3' },
  { id: 'bugs', label: 'Go to Bugs', combo: '⌘4' },
  { id: 'resources', label: 'Open Resources', combo: '⌘R' },
  { id: 'settings', label: 'Open Settings', combo: '⌘,' },
];
