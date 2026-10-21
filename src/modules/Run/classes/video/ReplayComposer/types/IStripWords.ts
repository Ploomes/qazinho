/** The words the strip writes, in the language the QA reads. */
export interface IStripWords {
  title: string;
  count: (props: { shown: number; total: number }) => string;
  errors: (count: number) => string;
  failed: string;
  canceled: string;
  empty: string;
  language: string;
}
