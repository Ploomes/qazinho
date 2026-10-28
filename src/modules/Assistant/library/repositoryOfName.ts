/**
 * O dono e o nome que as palavras do QA dão para um repositório do GitHub, como
 * owner/name ou o endereço github.com; null para qualquer outra coisa.
 */
export function repositoryOfName(text: string): { owner: string; name: string } | null {
  const path = text
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');
  const match = /^([\w.-]+)\/([\w.-]+)$/.exec(path);

  if (!match?.[1] || !match[2]) return null;

  return { owner: match[1], name: match[2] };
}
