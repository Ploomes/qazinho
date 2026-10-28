import type { BugReportBlock } from '@/shared/types';

const ITEM = /^\s*[-*•]\s+/;

/**
 * Um comentário em texto simples lido nos blocos de um relatório: parágrafos separados
 * por uma linha em branco, e uma sequência de linhas que começam com hífen como lista.
 */
export function blocksOfComment(text: string): BugReportBlock[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.split('\n').filter((line) => line.trim() !== ''))
    .filter((lines) => lines.length > 0)
    .map((lines): BugReportBlock =>
      lines.every((line) => ITEM.test(line))
        ? { kind: 'list', items: lines.map((line) => line.replace(ITEM, '').trim()) }
        : { kind: 'paragraph', text: lines.map((line) => line.trim()).join('\n') },
    );
}
