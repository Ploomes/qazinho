const SECTION = /^[ \t]*\[\[?[ \t]*mcp_servers\.([A-Za-z0-9_-]+)\b/gm;
const DOTTED = /^[ \t]*mcp_servers\.([A-Za-z0-9_-]+)\./gm;

/**
 * Os nomes dos servidores MCP que um config.toml do Codex declara, cada um uma vez; um
 * nome que uma flag não consegue endereçar, entre aspas e com ponto, fica de fora.
 */
export function codexServersOf(toml: string): string[] {
  const names = [...toml.matchAll(SECTION), ...toml.matchAll(DOTTED)].map(
    ([, name]) => name ?? '',
  );

  return [...new Set(names)].filter((name) => name !== '');
}
