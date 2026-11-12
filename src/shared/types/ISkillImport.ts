/**
 * O que importar: skills deste computador pelos caminhos, ou de uma pasta de um
 * repositório numa branch, pelos nomes escolhidos.
 */
export type ISkillImport =
  | { from: 'computer'; paths: string[] }
  | { from: 'repo'; repository: string; branch: string; folder: string; names: string[] };
