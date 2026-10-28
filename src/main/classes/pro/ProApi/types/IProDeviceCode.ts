/**
 * Um código de login que a plataforma entregou a esta máquina: o código para fazer
 * polling, o que a pessoa confirma, onde, e por quanto tempo.
 */
export interface IProDeviceCode {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
}
