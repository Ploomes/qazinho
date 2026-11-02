import { sizeScaleOf } from './sizeScaleOf';

/**
 * Um número de bytes como uma pessoa lê num disco: kilobytes, megabytes ou gigabytes, com
 * uma decimal depois de um megabyte.
 */
export function sizeWordsOf(props: { bytes: number; language: string }): string {
  const { unit, amount, fractionDigits } = sizeScaleOf(props.bytes);

  return new Intl.NumberFormat(props.language, {
    style: 'unit',
    unit,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}
