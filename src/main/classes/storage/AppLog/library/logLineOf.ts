import type { LogLevel } from '@/main/classes/storage/AppLog/types';
import { APP_LOG } from '@/main/classes/storage/AppLog/constants';

const SECRETS: [RegExp, string][] = [
  [/\bATATT[\w\-=]{16,}/g, '•••'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/g, '•••'],
  [/\bgithub_pat_\w{20,}/g, '•••'],
  [/\bsk-(?:ant-)?[\w-]{20,}/g, '•••'],
  [/\bxox[abprs]-[\w-]{10,}/g, '•••'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '•••'],
  [/\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g, '•••'],
  [/\b(Bearer|Basic)\s+[\w\-.=+/]{8,}/gi, '$1 •••'],
  [
    /\b(password|passwd|senha|token|secret|api[_-]?key)(["']?\s*[:=]\s*["']?)[^\s"',;&]+/gi,
    '$1$2•••',
  ],
];

/**
 * Uma linha do log do app: quando, quanto importa, de onde e o quê, com os segredos como
 * pontos.
 */
export function logLineOf(props: {
  at: Date;
  level: LogLevel;
  scope: string;
  message: string;
  home: string;
}): string {
  let message = props.message.replace(/\s*\r?\n\s*/g, ' ⏎ ').trim();

  if (props.home.length > 1) message = message.split(props.home).join('~');

  for (const [pattern, dots] of SECRETS) message = message.replace(pattern, dots);

  if (message.length > APP_LOG.maxLineChars)
    message = `${message.slice(0, APP_LOG.maxLineChars)}…`;

  return `${props.at.toISOString()} ${props.level.toUpperCase().padEnd(5)} [${props.scope}] ${message}\n`;
}
