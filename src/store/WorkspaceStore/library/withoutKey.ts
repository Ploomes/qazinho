/** Um registro sem uma chave, o mesmo registro quando ele nunca a teve. */
export function withoutKey<T>(props: {
  record: Record<string, T>;
  key: string;
}): Record<string, T> {
  if (!(props.key in props.record)) return props.record;

  const { [props.key]: _gone, ...rest } = props.record;

  return rest;
}
