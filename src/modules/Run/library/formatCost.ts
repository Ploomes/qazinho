/**
 * A cost in US dollars, written the way the QA's language writes money: cents, or a tenth
 * of a cent under a dime.
 */
export function formatCost(props: { costUsd: number; language: string }): string {
  const { costUsd, language } = props;

  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: costUsd < 0.1 ? 3 : 2,
  }).format(costUsd);
}
