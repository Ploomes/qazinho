import { AGENT_MCP } from '@/main/classes/integrations/AgentMcp/constants';
import { execCommand } from '@/main/library';

/** Runs one command to its end; a failure throws what it printed on stderr, which is what the QA needs to read. */
export async function runCommand(props: {
  command: string;
  args: string[];
  cwd?: string;
}): Promise<string> {
  try {
    const { stdout } = await execCommand({
      command: props.command,
      args: props.args,
      options: {
        cwd: props.cwd,
        timeout: AGENT_MCP.timeoutMs,
        maxBuffer: AGENT_MCP.maxBufferBytes,
      },
    });

    return stdout;
  } catch (reason) {
    const { stderr, message } = reason as { stderr?: string; message: string };

    throw new Error(
      stderr !== undefined && stderr.trim().length > 0 ? stderr.trim() : message,
      {
        cause: reason,
      },
    );
  }
}
