const OPENING = /^\s*:\s*"/;

const ESCAPES: Record<string, string> = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
};

/**
 * O que um campo de texto de um JSON ainda pela metade já diz; vazio enquanto ele não
 * começou. Um escape cortado espera o próximo pedaço.
 */
export function replyInPartial(props: { written: string; field: string }): string {
  const start = valueStartOf(props);

  return start === null ? '' : stringFrom({ written: props.written, start });
}

function valueStartOf(props: { written: string; field: string }): number | null {
  const { written, field } = props;
  let depth = 0;

  for (let at = 0; at < written.length; at += 1) {
    const char = written[at];

    if (char === '{' || char === '[') depth += 1;
    else if (char === '}' || char === ']') depth -= 1;
    else if (char === '"') {
      const close = endOfString({ written, open: at });

      if (close === null) return null;

      const after = written.slice(close + 1);
      const opening = OPENING.exec(after);

      if (depth === 1 && opening !== null && written.slice(at + 1, close) === field)
        return close + 1 + opening[0].length;

      at = close;
    }
  }

  return null;
}

function endOfString(props: { written: string; open: number }): number | null {
  const { written, open } = props;

  for (let at = open + 1; at < written.length; at += 1) {
    if (written[at] === '\\') at += 1;
    else if (written[at] === '"') return at;
  }

  return null;
}

function stringFrom(props: { written: string; start: number }): string {
  const { written, start } = props;
  let text = '';

  for (let at = start; at < written.length; at += 1) {
    const char = written[at] ?? '';

    if (char === '"') return text;

    if (char !== '\\') {
      text += char;
      continue;
    }

    const next = written[at + 1];

    if (next === undefined) return text;

    if (next === 'u') {
      const hex = written.slice(at + 2, at + 6);

      if (hex.length < 4) return text;

      text += String.fromCharCode(Number.parseInt(hex, 16));
      at += 5;
      continue;
    }

    text += ESCAPES[next] ?? next;
    at += 1;
  }

  return text;
}
