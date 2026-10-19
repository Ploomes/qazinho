/** A record without one key, the same record when it never had it. */
export function withoutKey<T>(props: {
  record: Record<string, T>;
  key: string;
}): Record<string, T> {
  if (!(props.key in props.record)) return props.record;

  const { [props.key]: _gone, ...rest } = props.record;

  return rest;
}
