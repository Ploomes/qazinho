const SETTING = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

/** The settings a dotenv file names, in its order and once each, with no value and no line left as a comment. */
export function envKeysOf(text: string): string[] {
  const keys = text.split(/\r?\n/).flatMap((line) => {
    const key = SETTING.exec(line)?.[1];

    return key === undefined ? [] : [key];
  });

  return [...new Set(keys)];
}
