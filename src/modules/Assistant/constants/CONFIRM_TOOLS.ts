import type { ConfirmAction } from '@/modules/Assistant/types';

export const CONFIRM_TOOLS: readonly ConfirmAction[] = [
  'delete_workspace',
  'delete_project',
  'delete_variable',
  'disconnect_integration',
];
