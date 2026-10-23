import { join } from 'node:path';

/** Where the QA's Codex keeps its config.toml: in CODEX_HOME when it is set, else in .codex under their home. */
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
