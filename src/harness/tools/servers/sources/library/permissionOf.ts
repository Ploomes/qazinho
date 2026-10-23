/** What QAzinho answers when Claude Code asks whether the chat may use a tool: any tool of an MCP server, the QA's own included, and nothing else, such as a file read outside the folders the chat was handed. */
export function permissionOf(props: {
  toolName: string;
  input: unknown;
}): { behavior: 'allow'; updatedInput: unknown } | { behavior: 'deny'; message: string } {
  return props.toolName.startsWith('mcp__')
    ? { behavior: 'allow', updatedInput: props.input }
    : {
        behavior: 'deny',
        message: `QAzinho does not let the chat use ${props.toolName} there: it reads only the folders it was handed, and works through MCP tools.`,
      };
}
