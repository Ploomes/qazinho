/**
 * Como uma CLI de agente faz o usuário entrar: o comando depois do binário, e se ela pode
 * pedir um código que a página mostra.
 */
export interface ILoginRecipe {
  args: string[];
  takesCode: boolean;
}
