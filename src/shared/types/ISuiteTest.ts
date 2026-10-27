/** One test of a suite as Playwright lists it, once per Playwright project it runs in. */
export interface ISuiteTest {
  id: string;
  file: string;
  line: number;
  path: string[];
  title: string;
  tags: string[];
  project: string;
}
