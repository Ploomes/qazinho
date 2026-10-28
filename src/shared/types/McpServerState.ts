/**
 * Em que pé está um servidor MCP no agente do QA: nenhum agente, um agente que o QAzinho
 * ainda não sabe configurar, não adicionado, deslogado, funcionando, ou quebrado.
 */
export type McpServerState =
  'no-agent' | 'unsupported' | 'missing' | 'needs-auth' | 'connected' | 'failed';
