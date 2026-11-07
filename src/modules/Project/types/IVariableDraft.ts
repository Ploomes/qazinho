/**
 * Uma variável editada antes de salvar: `from` é o nome salvo, null quando nova; um
 * `value` vazio mantém o salvo, e um `isSecret` null segue o nome.
 */
export interface IVariableDraft {
  key: string;
  name: string;
  description: string;
  value: string;
  from: string | null;
  isSecret: boolean | null;
}
