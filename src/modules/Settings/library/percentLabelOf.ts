/**
 * A fatia de um total como se lê: inteira, e menor que 1% para o que existe mas não
 * chega a tanto.
 */
export function percentLabelOf(props: {
  part: number;
  total: number;
  language: string;
}): string {
  const percent = new Intl.NumberFormat(props.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  });
  const share = props.total > 0 ? props.part / props.total : 0;

  if (props.part > 0 && share < 0.01) return `<${percent.format(0.01)}`;

  return percent.format(share);
}
