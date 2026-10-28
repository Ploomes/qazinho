/**
 * Onde uma mudança trabalha: o repositório do QA, o worktree, a pasta da suíte e os
 * caminhos ligados.
 */
export interface IChangeWork {
  repo: string;
  work: string;
  dir: string;
  links: string[];
}
