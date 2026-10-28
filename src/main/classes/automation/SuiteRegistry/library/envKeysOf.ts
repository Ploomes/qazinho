const SETTING = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

/**
 * As configurações que um arquivo dotenv nomeia, na ordem dele e uma vez cada, sem valor
 * e sem linha deixada como comentário.
 */
export function envKeysOf(text: string): string[] {
  const keys = text.split(/\r?\n/).flatMap((line) => {
    const key = SETTING.exec(line)?.[1];

    return key === undefined ? [] : [key];
  });

  return [...new Set(keys)];
}
