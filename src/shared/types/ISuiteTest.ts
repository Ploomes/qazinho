/** One test of a suite as Playwright lists it, once for each Playwright project it runs in: its id there, the file it is written in (from the suite's folder) and its line, the describes around it, its title, its tags without the @, and the project; empty for a config with none. */
export interface ISuiteTest {
  id: string;
  file: string;
  line: number;
  path: string[];
  title: string;
  tags: string[];
  project: string;
}
