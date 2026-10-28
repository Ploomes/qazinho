/**
 * Os argumentos do gh api para um pedido: o caminho, com o método e os campos de texto,
 * um cabeçalho Accept, toda página, e um filtro jq quando pedido.
 */
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
