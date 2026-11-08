import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

const MCP_NAME = /^mcp__(.+?)__(.+)$/;

const TARGET_FIELDS = ['title', 'target', 'name', 'file_path', 'pattern', 'text'];

/**
 * Uma chamada de ferramenta nas palavras da tela: o nome sem o servidor, o Figma como um
 * só, e o alvo; nunca o que é digitado, que pode ser um segredo.
 */
export function toolCallOf(props: { name: string; input: unknown }): {
  tool: string;
  target: string;
} {
  const [, server, named] = MCP_NAME.exec(props.name) ?? [];

  return {
    tool:
      server === AGENT_RUN.figmaServer ? AGENT_RUN.figmaServer : (named ?? props.name),
    target: targetOf(props.input),
  };
}

function targetOf(input: unknown): string {
  if (typeof input !== 'object' || input === null) return '';

  const given = input as Record<string, unknown>;
  const found = TARGET_FIELDS.map((field) => given[field]).find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );

  return typeof found === 'string' ? found.trim() : '';
}
