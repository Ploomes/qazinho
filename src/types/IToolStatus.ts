/** A toolchain gocrash needs but never installs: it says where it is, or that it is missing. */
export interface IToolStatus {
  isFound: boolean;
  path: string | null;
}
