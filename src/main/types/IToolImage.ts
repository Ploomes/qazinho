/** Uma imagem que uma ferramenta devolveu ao agente, com a chamada que a pediu. */
export interface IToolImage {
  name: string;
  input: unknown;
  mediaType: string;
  data: string;
}
