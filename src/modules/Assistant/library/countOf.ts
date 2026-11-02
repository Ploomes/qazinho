/** Uma quantidade com o substantivo dela, no singular só quando é uma. */
export function countOf(props: { amount: number; noun: string }): string {
  return `${String(props.amount)} ${props.noun}${props.amount === 1 ? '' : 's'}`;
}
