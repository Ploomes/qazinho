/** Something a test left behind, such as its screenshot, video, trace or the page as it stood when it failed: its name and type, where it sits in its run's folder, and its address on loopback while QAzinho is open. */
export interface ISuiteAttachment {
  name: string;
  contentType: string;
  file: string;
  url: string | null;
}
