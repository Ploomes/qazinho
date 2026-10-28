/**
 * Um custo em dólares, escrito do jeito que o idioma do QA escreve dinheiro: centavos, ou
 * um décimo de centavo abaixo de dez centavos.
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
