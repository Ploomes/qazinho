import type { ConfirmAction } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import { CONFIRM_TOOLS } from '@/modules/Assistant/constants/CONFIRM_TOOLS';

/** Whether a call waits for the QA on a card in the chat before it does anything. */
export function isConfirmCall(
  call: AppToolCall,
): call is Extract<AppToolCall, { name: ConfirmAction }> {
  return CONFIRM_TOOLS.some((action) => action === call.name);
}
