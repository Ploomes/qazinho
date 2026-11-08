import type { IScreenBox } from '@/shared/types';
import type { IDeviceDriver } from '@salve-software/qazinho-harness/engine';

/**
 * Onde está na tela o que um bug aponta: o que o agente nomeou, ou, num bug contra o
 * design, o que ele acabou de medir; nada quando não dá para dizer.
 */
export async function markedBoxOf(props: {
  driver: Pick<IDeviceDriver, 'locate'>;
  target?: string;
  frame?: string;
  inspected: string | null;
}): Promise<IScreenBox | null> {
  const { driver, target, frame, inspected } = props;
  const named = target ?? (frame === undefined ? null : inspected);

  if (named === null || driver.locate === undefined) return null;

  return driver.locate(named).catch(() => null);
}
