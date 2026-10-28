/**
 * Como foi adicionar, remover ou entrar num servidor MCP; uma falha leva o que dizer ao
 * QA.
 */
export type McpActionResult = { ok: true } | { ok: false; error: string };
