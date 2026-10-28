/**
 * Por que uma suíte não listou ou rodou os testes: nenhuma suíte conectada, pacotes não
 * instalados, sem node nesta máquina, ou o Playwright quebrando antes dos testes.
 */
export type SuiteFailure = 'no-suite' | 'no-runner' | 'no-node' | 'unreadable';
