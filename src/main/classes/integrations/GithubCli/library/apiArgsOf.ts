/** The gh api arguments for one request: the path, with an Accept header, every page, and a jq filter when asked. */
export function apiArgsOf(props: {
  path: string;
  accept?: string;
  paginate?: boolean;
  jq?: string;
}): string[] {
  return [
    'api',
    ...(props.accept === undefined ? [] : ['-H', `Accept: ${props.accept}`]),
    ...(props.paginate === true ? ['--paginate'] : []),
    ...(props.jq === undefined ? [] : ['--jq', props.jq]),
    props.path,
  ];
}
