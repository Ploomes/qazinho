import { APP_NAMES } from '@/main/classes/projects/AppNames/constants';

/** O nome do app no `aapt2 dump badging` de um .apk, o que fica sob o ícone; ou null. */
export function labelOfBadging(dumped: string): string | null {
  const label =
    /^application-label:'([^']*)'/m.exec(dumped)?.[1] ??
    /^application: label='([^']*)'/m.exec(dumped)?.[1] ??
    '';
  const name = label.trim();

  return name === '' || name.length > APP_NAMES.longest ? null : name;
}
