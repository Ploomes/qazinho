import type { BugCategory } from '@/shared/types';
import type { IDeviceDriver } from '@ploomes/qazinho-harness/engine';

/**
 * Rola até o que um bug aponta antes de a tela virar a prova dele; nada para um bug que
 * não aponta uma coisa só.
 */
export async function revealTarget(props: {
  driver: Pick<IDeviceDriver, 'reveal'>;
  target?: string;
  category?: BugCategory;
}): Promise<void> {
  const { driver, target, category } = props;

  if (target === undefined || category === 'behavior' || driver.reveal === undefined)
    return;

  await driver.reveal(target).catch(() => false);
}
