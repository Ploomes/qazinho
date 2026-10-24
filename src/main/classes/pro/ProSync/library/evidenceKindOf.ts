import { extname } from 'node:path';

const KINDS: Record<string, { kind: 'screenshot' | 'video'; contentType: string }> = {
  '.jpg': { kind: 'screenshot', contentType: 'image/jpeg' },
  '.jpeg': { kind: 'screenshot', contentType: 'image/jpeg' },
  '.png': { kind: 'screenshot', contentType: 'image/png' },
  '.mp4': { kind: 'video', contentType: 'video/mp4' },
  '.webm': { kind: 'video', contentType: 'video/webm' },
};

/** Whether a file of a run is a screenshot or a video, and its content type; null for one QAzinho never sends. */
export function evidenceKindOf(
  file: string,
): { kind: 'screenshot' | 'video'; contentType: string } | null {
  return KINDS[extname(file).toLowerCase()] ?? null;
}
