import { BUG_FLASH } from '@/modules/Device/constants';

/**
 * Quanto um bug pego fica na tela: o tempo de ler o título dele, e menos com outros
 * esperando a vez ou depois dos primeiros da run.
 */
export function bugFlashHoldOf(props: {
  title: string;
  waiting: number;
  isQuiet?: boolean;
  hasFocus?: boolean;
}): number {
  const focus = props.hasFocus === true ? BUG_FLASH.focusExtraMs : 0;

  if (props.waiting >= BUG_FLASH.busyWaiting) return BUG_FLASH.busyHoldMs + focus;

  if (props.isQuiet === true) return BUG_FLASH.quietHoldMs + focus;

  return (
    BUG_FLASH.holdMs +
    focus +
    Math.min(props.title.length * BUG_FLASH.perLetterMs, BUG_FLASH.longestExtraMs)
  );
}
