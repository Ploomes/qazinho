import type { OutsideToolCall } from '@/shared/types';

export const OUTSIDE_CHANGES = [
  'update_project',
  'delete_project',
  'rename_workspace',
  'delete_workspace',
  'explore_app',
  'dismiss_bug',
  'send_bug',
  'add_cases',
  'update_cases',
  'delete_cases',
] as const satisfies readonly OutsideToolCall['name'][];
