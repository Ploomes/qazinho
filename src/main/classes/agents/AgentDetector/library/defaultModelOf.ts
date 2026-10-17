/** The model an agent's own config file names as its default, or null when it names none. */
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
    const model = read.model;

    if (typeof model === 'string') return model;
    if (typeof model === 'object' && model !== null && 'name' in model)
      return typeof model.name === 'string' ? model.name : null;

    return null;
  } catch {
    return null;
  }
}
