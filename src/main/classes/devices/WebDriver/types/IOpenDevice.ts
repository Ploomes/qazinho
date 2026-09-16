/** Every workspace drives its own Chrome profile, so a login in one is not a login in all. */
export interface IOpenDevice {
  url: string;
  profileDir: string;
}
