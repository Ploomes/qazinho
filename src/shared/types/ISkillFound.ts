/**
 * Uma skill achada para importar, neste computador ou num repositório: o nome, quando
 * usar, onde está, e se o QAzinho já a tem.
 */
export interface ISkillFound {
  name: string;
  description: string;
  path: string;
  isKept: boolean;
}
