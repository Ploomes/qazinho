/**
 * A response gh printed with --include: its HTTP status, its headers in lower case, and
 * its body.
 */
export interface IIncluded {
  status: number;
  headers: Record<string, string>;
  body: string;
}
