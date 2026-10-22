/** One test of a suite as Playwright lists it: its id, the file it is written in (from the suite's folder) and its line, the describes around it, its title, its tags without the @, and the Playwright projects it runs in. */
export interface ISuiteTest {
  id: string;
  file: string;
  line: number;
  path: string[];
  title: string;
  tags: string[];
  projects: string[];
}
