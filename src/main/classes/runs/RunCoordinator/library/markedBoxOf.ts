import type { BugCategory, IScreenBox } from '@/shared/types';
import type { IDeviceDriver } from '@salve-software/qazinho-harness/engine';
import { MARKED_BOX } from '@/main/classes/runs/RunCoordinator/constants';

/**
 * Onde está na tela o que um bug aponta, quando ele é sobre uma coisa só: o que não
 * aconteceu, ou o que ocupa boa parte da tela, fica na foto inteira.
 */
export async function markedBoxOf(props: {
  driver: Pick<IDeviceDriver, 'locate'>;
  target?: string;
  category?: BugCategory;
}): Promise<IScreenBox | null> {
  const { driver, target, category } = props;

  if (target === undefined || category === 'behavior' || driver.locate === undefined)
    return null;

  const box = await driver.locate(target).catch(() => null);

  return box !== null && box.width * box.height <= MARKED_BOX.maxCover ? box : null;
}
