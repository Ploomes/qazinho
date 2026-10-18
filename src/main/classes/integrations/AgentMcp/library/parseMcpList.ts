import type { IListedMcpServer } from '@/main/classes/integrations/AgentMcp/types';

const LINE = /^(.+?): (.+?)(?: \((?:HTTP|SSE|stdio)\))? - (.+)$/i;

/** Reads `claude mcp list`: one server per line, as name, target and health. */
export function parseMcpList(printed: string): IListedMcpServer[] {
  return printed.split('\n').flatMap((line) => {
    const match = LINE.exec(line.trim());

    if (!match) return [];

    const [, name = '', target = '', health = ''] = match;
    const state =
      /connected/i.test(health) && !/fail/i.test(health)
        ? 'connected'
        : /auth/i.test(health)
          ? 'needs-auth'
          : 'failed';

    return [{ name, target, state }];
  });
}
