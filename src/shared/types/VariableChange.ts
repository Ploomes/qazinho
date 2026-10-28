/**
 * Uma mudança nas variáveis de um projeto: salva sob um nome, renomeada quando `from`
 * nomeia outra, com o valor mantido quando `value` é null; ou removida.
 */
export type VariableChange =
  | {
      kind: 'save';
      name: string;
      description: string;
      value: string | null;
      from: string | null;
    }
  | { kind: 'remove'; name: string };
