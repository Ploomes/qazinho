import type { AssistantConfirmAction } from '@/modules/Assistant/types';

export const CONFIRM_TOOLS: readonly AssistantConfirmAction[] = [
  'delete_workspace',
  'delete_project',
  'delete_variable',
  'disconnect_integration',
  'send_bug',
];
