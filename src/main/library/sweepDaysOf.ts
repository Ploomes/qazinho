const MOST_DAYS = 3650;

/**
 * Por quantos dias a página pediu para guardar os vídeos: um número inteiro de um a dez
 * anos; null para qualquer outra coisa.
 */
export function sweepDaysOf(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MOST_DAYS
    ? value
    : null;
}
