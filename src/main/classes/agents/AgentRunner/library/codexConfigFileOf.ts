import { join } from 'node:path';

/**
 * Onde o Codex do QA guarda o config.toml: em CODEX_HOME quando definido, senão em .codex
 * na home dele.
 */
export function codexConfigFileOf(props: {
  env: Record<string, string | undefined>;
  home: string;
}): string {
  const codexHome = props.env.CODEX_HOME;

  return join(
    codexHome === undefined || codexHome === '' ? join(props.home, '.codex') : codexHome,
    'config.toml',
  );
}
