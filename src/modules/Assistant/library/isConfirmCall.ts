import type { ConfirmAction } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import { CONFIRM_TOOLS } from '@/modules/Assistant/constants/CONFIRM_TOOLS';

/** Se uma chamada espera pelo QA num cartão no chat antes de fazer qualquer coisa. */
export function isConfirmCall(
  call: AppToolCall,
): call is Extract<AppToolCall, { name: ConfirmAction }> {
  return CONFIRM_TOOLS.some((action) => action === call.name);
}
