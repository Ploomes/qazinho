/**
 * Uma mudança nas variáveis de um projeto: salva sob um nome, renomeada quando `from`
 * nomeia outra, com o valor e o segredo mantidos quando ficam de fora; ou removida.
 */
export type VariableChange =
  | {
      kind: 'save';
      name: string;
      description: string;
      value: string | null;
      from: string | null;
      isSecret?: boolean;
    }
  | { kind: 'remove'; name: string };
