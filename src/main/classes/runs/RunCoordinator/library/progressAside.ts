import type { IStepWatch } from '@/main/classes/runs/RunCoordinator/types';
import { RUN_WATCH } from '@/main/classes/runs/RunCoordinator/constants';

/**
 * O lembrete que o agente recebe num passo que não anda: dizer ao QA por que, de tempos
 * em tempos, e perguntar a ele quando já tentou demais.
 */
export function progressAside(props: {
  watch: IStepWatch;
  stepNumber: number;
  tookMs: number;
}): { watch: IStepWatch; text: string | null } {
  const { watch, stepNumber, tookMs } = props;
  const isLong =
    watch.actions >= RUN_WATCH.askAfterActions || tookMs >= RUN_WATCH.askAfterMs;
  const isAskDue =
    isLong &&
    watch.actions > 0 &&
    (watch.askedAt === 0 || watch.actions - watch.askedAt >= RUN_WATCH.askAgainActions);

  if (isAskDue)
    return {
      watch: { ...watch, askedAt: watch.actions, sinceSay: 0 },
      text: `You have spent ${String(watch.actions)} actions on step ${String(stepNumber)} and have not reported it. If you are looking for something you cannot find, or the app does not do what you expected, stop and call ask_qa now: say what you tried and what you need. If you are getting somewhere, call say with why this takes so long, and go on.`,
    };

  if (watch.sinceSay >= RUN_WATCH.sayEveryActions)
    return {
      watch: { ...watch, sinceSay: 0 },
      text: `The QA has watched ${String(watch.sinceSay)} actions on step ${String(stepNumber)} and heard nothing from you. Call say together with your next action: why you are doing this.`,
    };

  return { watch, text: null };
}
