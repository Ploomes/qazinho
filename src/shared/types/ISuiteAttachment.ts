/**
 * Something a test left behind, such as a screenshot or trace: its type, file and address
 * on loopback.
 */
export interface ISuiteAttachment {
  name: string;
  contentType: string;
  file: string;
  url: string | null;
}
