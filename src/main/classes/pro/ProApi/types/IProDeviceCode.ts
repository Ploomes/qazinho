/**
 * A sign-in code the platform handed this machine: the code to poll with, the one the
 * person confirms, where, and for how long.
 */
export interface IProDeviceCode {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
}
