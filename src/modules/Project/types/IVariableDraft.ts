/**
 * Uma variável como o QA a edita antes de salvar: `from` é o nome salvo que ela
 * representa, null quando nova, e um `value` vazio mantém o salvo.
 */
export interface IVariableDraft {
  key: string;
  name: string;
  description: string;
  value: string;
  from: string | null;
}
