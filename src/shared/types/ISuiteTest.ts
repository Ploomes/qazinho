/**
 * Um teste de uma suíte como o Playwright o lista, uma vez por projeto do Playwright em
 * que roda.
 */
export interface ISuiteTest {
  id: string;
  file: string;
  line: number;
  path: string[];
  title: string;
  tags: string[];
  project: string;
}
