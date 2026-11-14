import { APP_NAMES } from '@/main/classes/projects/AppNames/constants';

/** O nome que o `plutil -extract` leu do Info.plist de um .app, ou null sem um. */
export function bundleNameOf(printed: string): string | null {
  const name = (printed.trim().split('\n')[0] ?? '').trim();

  return name === '' || name.length > APP_NAMES.longest || /^\$\(/.test(name)
    ? null
    : name;
}
