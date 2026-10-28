import { PRO_LINK } from '@/main/constants/PRO_LINK';

/**
 * O endereço `qazinho:` entre os argumentos com que o Windows e o Linux iniciam o app, se
 * houver.
 */
export function proLinkAddressIn(argv: string[]): string | undefined {
  return argv.find((arg) => arg.startsWith(`${PRO_LINK.scheme}:`));
}
