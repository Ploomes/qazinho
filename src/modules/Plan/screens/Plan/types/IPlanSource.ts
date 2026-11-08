/** De onde o plano veio, ou onde foi publicado: o rótulo, a chave, o título e o link. */
export interface IPlanSource {
  key: string;
  label: string;
  tag: string | null;
  title: string;
  url: string | null;
}
