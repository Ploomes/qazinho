const SECRETS = [
  /\bATATT[\w\-=]{16,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_\w{20,}/,
  /\bsk-(?:ant-)?[\w-]{20,}/,
  /\bxox[abprs]-[\w-]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

/** The first thing in a message that looks like a token or an API key, such as a Jira or GitHub token; null when there is none. */
export function secretIn(text: string): string | null {
  for (const pattern of SECRETS) {
    const found = pattern.exec(text);

    if (found !== null) return found[0];
  }

  return null;
}
