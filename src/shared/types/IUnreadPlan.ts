/**
 * Um plan.yaml que o QAzinho não conseguiu ler, posto de lado sob `file` na pasta do
 * workspace para nada o sobrescrever; `line` é onde quebrou, quando foi o próprio YAML.
 */
export interface IUnreadPlan {
  file: string;
  line: number | null;
}
