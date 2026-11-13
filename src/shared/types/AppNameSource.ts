/** De onde o nome de um app pode ser lido sem IA: a página, o build ou o repositório. */
export type AppNameSource =
  | { kind: 'web'; address: string }
  | { kind: 'android'; path: string }
  | { kind: 'ios'; path: string }
  | { kind: 'repo'; owner: string; name: string; branch: string };
