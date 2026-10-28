import type { IBugAppearance } from './IBugAppearance';
import type { IBugShot } from './IBugShot';

/** Uma vez posterior em que um bug foi pego de novo, com a tela que o mostrou. */
export interface IBugSighting extends IBugAppearance {
  shot: IBugShot;
}
