/** Um campo para um código que o QA copia de uma página de volta para o fluxo. */
export interface IStepsCode {
  label: string;
  placeholder: string;
  submit: string;
  onSubmit: (code: string) => void;
}
