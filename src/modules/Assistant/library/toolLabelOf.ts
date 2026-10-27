import type { ConfirmAction } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import type { ParseKeys } from 'i18next';
import { LATEST_RUN_LABEL } from '@/modules/Assistant/constants/LATEST_RUN_LABEL';
import { OPEN_LABELS } from '@/modules/Assistant/constants/OPEN_LABELS';
import { TOOL_LABELS } from '@/modules/Assistant/constants/TOOL_LABELS';

/**
 * The words a tool's line says while it goes and once done: a run read with none named is
 * the latest one, and opening a bug or a run says which.
 */
export function toolLabelOf(call: Exclude<AppToolCall, { name: ConfirmAction }>): {
  doing: ParseKeys;
  done: ParseKeys;
} {
  if (call.name === 'run_details' && call.args.run === undefined) return LATEST_RUN_LABEL;

  if (call.name === 'open_workspace' && call.args.bug !== undefined)
    return OPEN_LABELS.bug;

  if (call.name === 'open_workspace' && call.args.run !== undefined)
    return OPEN_LABELS.run;

  return TOOL_LABELS[call.name];
}
