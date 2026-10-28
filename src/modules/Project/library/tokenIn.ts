const TOKENS = [
  /\bATATT[\w\-=]{16,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_\w{20,}/,
  /\bsk-(?:ant-)?[\w-]{20,}/,
  /\bxox[abprs]-[\w-]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

/**
 * A primeira coisa numa mensagem que parece um token ou uma chave de API, como um token
 * do Jira ou do GitHub; null quando não há nenhuma.
 */
export function tokenIn(text: string): string | null {
  for (const pattern of TOKENS) {
    const found = pattern.exec(text);

    if (found !== null) return found[0];
  }

  return null;
}
