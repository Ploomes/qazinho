/**
 * How adding, removing or signing in to an MCP server went; a failure carries what to
 * tell the QA.
 */
export type McpActionResult = { ok: true } | { ok: false; error: string };
