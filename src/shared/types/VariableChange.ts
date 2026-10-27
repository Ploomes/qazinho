/**
 * One change to a project's variables: saved under a name, renamed when `from` names
 * another, its value kept when `value` is null; or removed.
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
