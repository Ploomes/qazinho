import type { IToolImage } from '@/main/types';
import { FIGMA_MCP } from '@ploomes/qazinho-harness';

/** O frame do Figma cuja imagem uma chamada trouxe; null para qualquer outra chamada. */
export function designFrameOf(call: Pick<IToolImage, 'name' | 'input'>): string | null {
  if (call.name !== `mcp__${FIGMA_MCP.name}__get_screenshot`) return null;

  const { nodeId } = (call.input ?? {}) as { nodeId?: unknown };

  return typeof nodeId === 'string' && nodeId.trim() !== ''
    ? nodeId.trim().replaceAll('-', ':')
    : null;
}
