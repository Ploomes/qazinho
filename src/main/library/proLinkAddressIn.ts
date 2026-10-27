import { PRO_LINK } from '@/main/constants/PRO_LINK';

/**
 * The `qazinho:` address among the arguments Windows and Linux start the app with, if
 * any.
 */
export function proLinkAddressIn(argv: string[]): string | undefined {
  return argv.find((arg) => arg.startsWith(`${PRO_LINK.scheme}:`));
}
