/** A field for a code the QA copies from a page back into the flow. */
export interface IStepsCode {
  label: string;
  placeholder: string;
  submit: string;
  onSubmit: (code: string) => void;
}
