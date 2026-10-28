/**
 * O título de um teste como o --grep do Playwright o lê: uma expressão regular que casa o
 * próprio título, sejam quais forem as marcas que ele tenha.
 */
export function titleGrepOf(title: string): string {
  return title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
