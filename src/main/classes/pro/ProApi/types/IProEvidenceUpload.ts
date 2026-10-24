/** Where the platform lets this machine put one file: the key it will be known by, the address, and the headers the upload must carry. */
export interface IProEvidenceUpload {
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
}
