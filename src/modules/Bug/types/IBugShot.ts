/**
 * O `src` é o screenshot em mãos; o `file` é onde ele fica quando o app fecha. O `isBad`
 * marca o passo que quebrou.
 */
export interface IBugShot {
  isBad: boolean;
  src: string | null;
  file: string | null;
}
