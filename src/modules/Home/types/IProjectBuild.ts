/** Um build que o QA escolheu para o projeto novo, e em que plataforma ele roda. */
export interface IProjectBuild {
  kind: 'android' | 'ios';
  path: string;
}
