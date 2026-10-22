/** What the git runner needs: where to look for git, the way the QA's own shell would. */
export interface IGitCli {
  directories: () => Promise<string[]>;
}
