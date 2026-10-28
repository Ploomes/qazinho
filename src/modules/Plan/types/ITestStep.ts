/**
 * Uma ação no dispositivo, o resultado que o QA espera dela, e o nó do Figma com que a
 * tela dela deve bater, quando o workspace tem design.
 */
export interface ITestStep {
  action: string;
  expected: string;
  frame?: string;
}
