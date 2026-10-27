/**
 * The model an agent's own config file names as its default, or null when it names none.
 */
export function defaultModelOf(props: {
  format: 'json' | 'toml';
  text: string;
}): string | null {
  if (props.format === 'toml') {
    const root = props.text.split(/^\s*\[/m)[0] ?? '';
    const match = /^\s*model\s*=\s*"([^"]+)"/m.exec(root);

    return match?.[1] ?? null;
  }

  try {
    const read = JSON.parse(props.text) as { model?: unknown };

    return typeof read.model === 'string' ? read.model : null;
  } catch {
    return null;
  }
}
