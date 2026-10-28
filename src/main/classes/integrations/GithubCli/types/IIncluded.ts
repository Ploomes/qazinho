/**
 * Uma resposta que o gh imprimiu com --include: o status HTTP, os cabeçalhos em
 * minúsculas e o corpo.
 */
export interface IIncluded {
  status: number;
  headers: Record<string, string>;
  body: string;
}
