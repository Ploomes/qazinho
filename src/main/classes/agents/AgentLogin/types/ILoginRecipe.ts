/**
 * Como uma CLI de agente faz o usuário entrar: o comando de login, rodado num terminal
 * visível, e o de status, que diz quando ele entrou.
 */
export interface ILoginRecipe {
  login: string[];
  status: { args: string[]; reads: 'claude' | 'codex' };
}
