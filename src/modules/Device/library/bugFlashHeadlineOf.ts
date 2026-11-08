import type { BugFlashHeadline, IBugFlash } from '@/modules/Device/types';
import { BUG_FLASH_HEADLINES } from '@/modules/Device/constants';

/**
 * A chave da frase grande de um bug pego: o tipo dele, contra o Figma quando é contra um
 * design; nula quando o agente não disse o tipo e nenhum design foi nomeado.
 */
export function bugFlashHeadlineOf(
  flash: Pick<IBugFlash, 'category' | 'isDesign'>,
): BugFlashHeadline | null {
  if (flash.category === null) return flash.isDesign ? 'DEVICE.BUG_DESIGN' : null;

  const headline = BUG_FLASH_HEADLINES[flash.category];

  return flash.isDesign ? headline.design : headline.plain;
}
