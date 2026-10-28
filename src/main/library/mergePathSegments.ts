/**
 * Divide cada PATH pelo separador da própria plataforma e mantém a primeira menção de
 * cada diretório: um PATH hidratado pode repetir o que o app já tinha.
 */
export function mergePathSegments(props: {
  segments: (string | undefined)[];
  platform: NodeJS.Platform;
}): string[] {
  const seen = new Set<string>();
  const separator = props.platform === 'win32' ? ';' : ':';

  return props.segments
    .filter((segment): segment is string => segment !== undefined && segment.length > 0)
    .flatMap((segment) => segment.split(separator))
    .map((directory) => directory.trim().replace(/^"(.*)"$/, '$1'))
    .filter((directory) => {
      const key = props.platform === 'win32' ? directory.toLowerCase() : directory;

      if (directory.length === 0 || seen.has(key)) return false;

      seen.add(key);

      return true;
    });
}
