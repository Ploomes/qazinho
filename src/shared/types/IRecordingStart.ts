/**
 * Uma run a gravar: o stream em loopback do dispositivo dela, e o id com que os bytes e o
 * fim dela voltam.
 */
export interface IRecordingStart {
  id: string;
  url: string;
}
