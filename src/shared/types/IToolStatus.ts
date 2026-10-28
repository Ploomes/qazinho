/**
 * Uma toolchain de que o QAzinho precisa mas nunca instala: diz onde está, ou que falta.
 */
export interface IToolStatus {
  isFound: boolean;
  path: string | null;
}
