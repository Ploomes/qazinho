import { stringify } from 'yaml';

/**
 * Um SKILL.md no padrão: o frontmatter com o nome e quando usar, depois as instruções,
 * com o que é só do QAzinho guardado em `metadata`.
 */
export function markdownOfSkill(props: {
  name: string;
  description: string;
  body: string;
}): string {
  const head = stringify(
    { name: props.name, description: props.description },
    { lineWidth: 0 },
  ).trimEnd();

  return `---\n${head}\n---\n\n${props.body.trim()}\n`;
}
