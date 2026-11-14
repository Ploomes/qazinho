import { APP_NAMES } from '@/main/classes/projects/AppNames/constants';

/** O nome do app no app.json de um projeto React Native ou Expo, ou null sem um. */
export function appNameOfManifest(text: string): string | null {
  try {
    const manifest = JSON.parse(text) as {
      expo?: { name?: unknown };
      displayName?: unknown;
      name?: unknown;
    };
    const name = [manifest.expo?.name, manifest.displayName, manifest.name].find(
      (one): one is string => typeof one === 'string' && one.trim() !== '',
    );

    return name === undefined || name.trim().length > APP_NAMES.longest
      ? null
      : name.trim();
  } catch {
    return null;
  }
}
