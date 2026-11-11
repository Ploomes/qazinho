/**
 * Como levar uma lista ao fim: deslizando quando falta menos de uma tela, ou de uma vez
 * quando falta mais, para nunca atravessar a conversa inteira na frente do QA.
 */
export function endScrollOf(props: {
  top: number;
  clientHeight: number;
  scrollHeight: number;
}): 'smooth' | 'instant' {
  const fromEnd = props.scrollHeight - props.clientHeight - props.top;

  return fromEnd > props.clientHeight ? 'instant' : 'smooth';
}
