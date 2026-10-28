/**
 * Um repositório do GitHub de que um projeto é feito, pelo id no GitHub, e a branch
 * contra a qual as mudanças dele são medidas.
 */
export interface IProjectRepository {
  id: string;
  owner: string;
  name: string;
  baseBranch: string;
}
