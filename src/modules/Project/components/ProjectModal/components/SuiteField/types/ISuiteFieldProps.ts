/** The Playwright suite a project runs: the project, none until it is created, and the names of its variables, which reach the tests as settings. */
export interface ISuiteFieldProps {
  projectId: string | null;
  variableNames: string[];
}
