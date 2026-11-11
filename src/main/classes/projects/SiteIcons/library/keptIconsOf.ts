import type { ISiteIconEntry } from '@/main/classes/projects/SiteIcons/types';

/** Os ícones guardados que o arquivo ainda tem em boa forma, cada um por origem. */
export function keptIconsOf(value: unknown): Record<string, ISiteIconEntry> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([origin, entry]) =>
      isEntry(entry) ? [[origin, { icon: entry.icon, at: entry.at }]] : [],
    ),
  );
}

function isEntry(entry: unknown): entry is ISiteIconEntry {
  if (typeof entry !== 'object' || entry === null) return false;

  const { icon, at } = entry as { icon?: unknown; at?: unknown };

  return (
    typeof at === 'number' &&
    (icon === null || (typeof icon === 'string' && icon.startsWith('data:image/')))
  );
}
