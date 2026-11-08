/**
 * Como a foto de um bug chega perto do que está errado, em frações da foto: o zoom, o
 * quanto ela anda, e onde a coisa fica depois disso.
 */
export interface IBugFocus {
  zoom: number;
  shiftX: number;
  shiftY: number;
  left: number;
  top: number;
  width: number;
  height: number;
}
