/** Um texto de um modelo com cada campo {{nome}} trocado pelo valor dele, ou por nada. */
export function fillValues(props: {
  text: string;
  values: Record<string, string>;
}): string {
  return props.text.replace(/\{\{\s*([a-z]+)\s*\}\}/gi, (_whole, name: string) =>
    (props.values[name] ?? '').trim(),
  );
}
