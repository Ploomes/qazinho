/**
 * Algo que um teste deixou, como um screenshot ou trace: o tipo, o arquivo e o endereço
 * em loopback.
 */
export interface ISuiteAttachment {
  name: string;
  contentType: string;
  file: string;
  url: string | null;
}
