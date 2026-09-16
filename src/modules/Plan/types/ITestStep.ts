/** One action on the device and the result the QA expects from it. */
export interface ITestStep {
  action: string;
  expected: string;
}
