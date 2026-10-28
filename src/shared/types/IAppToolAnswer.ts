/**
 * O que a página fez com uma chamada de ferramenta do app, em palavras para o agente, e
 * se falhou.
 */
export interface IAppToolAnswer {
  id: string;
  text: string;
  isError: boolean;
}
