import type { IAgentLine } from '@/main/types';

/** As imagens que uma ferramenta respondeu nesta linha, cada uma com o id da chamada. */
export function toToolImages(
  line: IAgentLine,
): { callId: string; mediaType: string; data: string }[] {
  if (line.type !== 'user') return [];

  return (line.message?.content ?? []).flatMap((block) => {
    if (block.type !== 'tool_result' || block.tool_use_id === undefined) return [];

    const callId = block.tool_use_id;

    return (Array.isArray(block.content) ? block.content : []).flatMap((part) =>
      part.type === 'image' &&
      part.source?.data !== undefined &&
      part.source.media_type !== undefined
        ? [{ callId, mediaType: part.source.media_type, data: part.source.data }]
        : [],
    );
  });
}
