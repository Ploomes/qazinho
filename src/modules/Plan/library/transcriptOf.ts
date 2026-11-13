const CUE =
  /^(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*((\d{1,2}:)?\d{1,2}:\d{2})[.,]\d{1,3}/;

/**
 * O texto de uma transcrição de reunião, sem os tempos e os números de um VTT ou SRT, e
 * quantos minutos ela durou quando os tempos dizem.
 */
export function transcriptOf(raw: string): { text: string; minutes: number | null } {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  let last: number | null = null;
  let isNote = false;
  const said: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const cue = CUE.exec(trimmed);

    if (cue !== null) {
      last = secondsOf(cue[2] ?? '');
      isNote = false;
      continue;
    }

    if (trimmed === '') {
      isNote = false;
      continue;
    }

    if (trimmed === 'WEBVTT' || trimmed.startsWith('WEBVTT ')) continue;

    if (trimmed.startsWith('NOTE') || trimmed.startsWith('STYLE')) {
      isNote = true;
      continue;
    }

    if (isNote || /^\d+$/.test(trimmed)) continue;

    const text = trimmed
      .replace(/<v\s+([^>]+)>/g, '$1: ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (text !== '' && said.at(-1) !== text) said.push(text);
  }

  return { text: said.join('\n'), minutes: last === null ? null : Math.ceil(last / 60) };
}

function secondsOf(stamp: string): number {
  return stamp
    .split(':')
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}
