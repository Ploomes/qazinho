import type { IIncluded } from '@/main/classes/integrations/GithubCli/types';

const STATUS = /^HTTP\/[\d.]+\s+(\d{3})/;

/** Divide o que o gh api --include imprimiu em status, cabeçalhos e corpo. */
export function includedOf(text: string): IIncluded {
  const normalized = text.replace(/\r\n/g, '\n');
  const split = normalized.indexOf('\n\n');
  const head = split === -1 ? normalized : normalized.slice(0, split);
  const [statusLine = '', ...lines] = head.split('\n');

  return {
    status: Number(STATUS.exec(statusLine)?.[1] ?? 0),
    headers: Object.fromEntries(
      lines.flatMap((line) => {
        const at = line.indexOf(':');

        return at <= 0
          ? []
          : [[line.slice(0, at).trim().toLowerCase(), line.slice(at + 1).trim()]];
      }),
    ),
    body: split === -1 ? '' : normalized.slice(split + 2),
  };
}
