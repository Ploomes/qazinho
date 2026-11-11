/** Um build de celular escolhido no disco, e para que plataforma. */
export interface IFirstRunBuild {
  kind: 'android' | 'ios';
  path: string;
}
