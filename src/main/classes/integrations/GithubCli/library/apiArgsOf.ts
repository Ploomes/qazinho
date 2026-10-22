/** The gh api arguments for one request: the path, with its method and text fields, an Accept header, every page, and a jq filter when asked. */
export function apiArgsOf(props: {
  path: string;
  method?: 'POST';
  fields?: Record<string, string>;
  accept?: string;
  paginate?: boolean;
  jq?: string;
}): string[] {
  return [
    'api',
    ...(props.method === undefined ? [] : ['--method', props.method]),
    ...Object.entries(props.fields ?? {}).flatMap(([key, value]) => [
      '--raw-field',
      `${key}=${value}`,
    ]),
    ...(props.accept === undefined ? [] : ['-H', `Accept: ${props.accept}`]),
    ...(props.paginate === true ? ['--paginate'] : []),
    ...(props.jq === undefined ? [] : ['--jq', props.jq]),
    props.path,
  ];
}
