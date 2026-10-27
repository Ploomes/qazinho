/**
 * Puts one file's bytes at an address the platform signed, streaming it from disk; false
 * when it did not take them.
 */
export type ProUploader = (props: {
  url: string;
  headers: Record<string, string>;
  file: string;
}) => Promise<boolean>;
