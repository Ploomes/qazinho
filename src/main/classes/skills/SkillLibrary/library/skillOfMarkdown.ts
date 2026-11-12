import { parse } from 'yaml';
import { skillNameOf } from './skillNameOf';

type Loose = Record<string, unknown>;

/**
 * O nome, quando usar e as instruções de um SKILL.md; um arquivo sem frontmatter leva o
 * nome dado e a primeira linha como quando usar. Null quando não sobram instruções.
 */
export function skillOfMarkdown(props: {
  text: string;
  fallbackName: string;
}): { name: string; description: string; body: string } | null {
  const text = props.text.replace(/\r\n/g, '\n');
  const matched = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  const head = matched === null ? {} : headOf(matched[1] ?? '');
  const body = (matched === null ? text : (matched[2] ?? '')).trim();

  if (body === '') return null;

  const firstLine =
    body
      .split('\n')
      .find((line) => line.trim() !== '')
      ?.replace(/^#+\s*/, '')
      .trim() ?? '';

  return {
    name: skillNameOf(textOf(head.name) || props.fallbackName),
    description: textOf(head.description) || firstLine,
    body,
  };
}

function headOf(yaml: string): Loose {
  try {
    const read: unknown = parse(yaml);

    return typeof read === 'object' && read !== null && !Array.isArray(read)
      ? (read as Loose)
      : {};
  } catch {
    return {};
  }
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
