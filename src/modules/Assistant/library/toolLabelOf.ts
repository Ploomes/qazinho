import type { AssistantConfirmAction } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import type { ParseKeys } from 'i18next';
import { LATEST_RUN_LABEL } from '@/modules/Assistant/constants/LATEST_RUN_LABEL';
import { OPEN_LABELS } from '@/modules/Assistant/constants/OPEN_LABELS';
import { TOOL_LABELS } from '@/modules/Assistant/constants/TOOL_LABELS';

/**
 * As palavras que a linha de uma ferramenta diz enquanto anda e depois de feita: uma run
 * lida sem nenhuma nomeada é a última, e abrir um bug ou uma run diz qual.
 */
export function toolLabelOf(
  call: Exclude<AppToolCall, { name: AssistantConfirmAction }>,
): {
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
