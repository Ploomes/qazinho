/** One action on the device, the result the QA expects from it, and the Figma node its screen should match, when the workspace has a design. */
export interface ITestStep {
  action: string;
  expected: string;
  frame?: string;
}
