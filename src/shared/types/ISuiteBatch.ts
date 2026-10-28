/**
 * Parte de uma run que passa por um projeto do Playwright, com os testes que roda; nenhum
 * roda todos.
 */
export interface ISuiteBatch {
  project: string;
  filters: string[];
}
