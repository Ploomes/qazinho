/**
 * Os momentos entre dois frames, um por passo, em que segurar a imagem anterior, para a
 * faixa continuar andando enquanto a tela fica parada.
 */
export function fillersBetween(props: {
  fromUs: number;
  toUs: number;
  stepUs: number;
}): number[] {
  const { fromUs, toUs, stepUs } = props;
  const moments: number[] = [];

  if (stepUs <= 0) return moments;

  for (let at = fromUs + stepUs; at < toUs; at += stepUs) moments.push(at);

  return moments;
}
