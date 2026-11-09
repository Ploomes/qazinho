import type { NotchReading } from '@/main/classes/runs/Island/types';
import { NOTCH_SCRIPT } from '@/main/classes/runs/Island/constants';

/**
 * Pergunta ao macOS o tamanho do notch da tela principal; nenhuma medida quando o sistema
 * não é um Mac ou a tela não tem notch, e 'unknown' quando ele não respondeu.
 */
export async function measureNotch(props: {
  platform: NodeJS.Platform;
  run: (asked: { command: string; args: string[] }) => Promise<{ stdout: string }>;
}): Promise<NotchReading> {
  if (props.platform !== 'darwin') return null;

  try {
    const { stdout } = await props.run({
      command: '/usr/bin/osascript',
      args: ['-l', 'JavaScript', '-e', NOTCH_SCRIPT],
    });
    const { top, width } = JSON.parse(stdout) as { top?: unknown; width?: unknown };

    if (typeof top !== 'number' || typeof width !== 'number') return 'unknown';

    return top > 0 && width > 0 ? { width, height: top } : null;
  } catch {
    return 'unknown';
  }
}
