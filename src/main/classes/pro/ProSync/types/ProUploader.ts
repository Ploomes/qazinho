/**
 * Põe os bytes de um arquivo num endereço que a plataforma assinou, transmitindo-o do
 * disco; false quando ela não os aceitou.
 */
export type ProUploader = (props: {
  url: string;
  headers: Record<string, string>;
  file: string;
}) => Promise<boolean>;
