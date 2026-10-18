/** What an MCP tool call answers the agent: one text, and whether it is an error the agent should act on. */
export type ToolAnswer = {
  content: { type: 'text'; text: string }[];
  isError: boolean;
};
