import { execCommand } from '@/main/library';

const TIMEOUT_MS = 15_000;

/**
 * Roda o comando de status de um agente e devolve o que ele imprimiu e como saiu; nunca
 * lança erro.
 */
export async function statusOf(props: {
  command: string;
  args: readonly string[];
}): Promise<{ code: number; printed: string }> {
  try {
    const { stdout, stderr } = await execCommand({
      command: props.command,
      args: [...props.args],
      options: { timeout: TIMEOUT_MS },
    });

    return { code: 0, printed: `${stdout}${stderr}` };
  } catch (reason) {
    const failed = reason as { code?: unknown; stdout?: string; stderr?: string };

    return {
      code: typeof failed.code === 'number' ? failed.code : 1,
      printed: `${failed.stdout ?? ''}${failed.stderr ?? ''}`,
    };
  }
}
