const SECTION = /^[ \t]*\[\[?[ \t]*mcp_servers\.([A-Za-z0-9_-]+)\b/gm;
const DOTTED = /^[ \t]*mcp_servers\.([A-Za-z0-9_-]+)\./gm;

/**
 * The names of the MCP servers a Codex config.toml declares, each once; a name a flag
 * cannot address, quoted with a dot in it, is left out.
 */
export function codexServersOf(toml: string): string[] {
  const names = [...toml.matchAll(SECTION), ...toml.matchAll(DOTTED)].map(
    ([, name]) => name ?? '',
  );

  return [...new Set(names)].filter((name) => name !== '');
}
