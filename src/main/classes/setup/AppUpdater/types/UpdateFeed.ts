/** De onde as versões vêm quando não é do repositório que o build gravou no app. */
export type UpdateFeed =
  | { provider: 'generic'; url: string }
  | { provider: 'github'; owner: string; repo: string; private: true; token: string };
