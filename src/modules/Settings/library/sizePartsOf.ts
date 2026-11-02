import { sizeScaleOf } from './sizeScaleOf';

/**
 * O tamanho de `sizeWordsOf` em duas partes, o número e a unidade, para a unidade poder
 * ficar menor ao lado do número.
 */
export function sizePartsOf(props: { bytes: number; language: string }): {
  value: string;
  unit: string;
} {
  const { unit, amount, fractionDigits } = sizeScaleOf(props.bytes);
  const parts = new Intl.NumberFormat(props.language, {
    style: 'unit',
    unit,
    maximumFractionDigits: fractionDigits,
  }).formatToParts(amount);

  return {
    value: parts
      .filter(({ type }) => type !== 'unit' && type !== 'literal')
      .map(({ value }) => value)
      .join(''),
    unit: parts.find(({ type }) => type === 'unit')?.value ?? '',
  };
}
