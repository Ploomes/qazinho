/**
 * Os argumentos do gh api para um pedido: o caminho, o método, os campos de texto ou um
 * corpo JSON pela entrada, um cabeçalho Accept, toda página e um filtro jq.
 */
export function apiArgsOf(props: {
  path: string;
  method?: 'POST';
  fields?: Record<string, string>;
  json?: unknown;
  accept?: string;
  paginate?: boolean;
  jq?: string;
}): string[] {
  return [
    'api',
    ...(props.method === undefined ? [] : ['--method', props.method]),
    ...(props.json === undefined ? [] : ['--input', '-']),
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
