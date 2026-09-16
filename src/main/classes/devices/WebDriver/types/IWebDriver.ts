/** Every workspace drives its own Chrome profile, so a login in one is not a login in all. */
export interface IWebDriver {
  url: string;
  profileDir: string;
}
