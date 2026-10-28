const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

/**
 * A extensão que os próprios bytes de uma imagem pedem: o screenshot de um celular é PNG,
 * o do Chrome é JPEG.
 */
export function imageExtensionOf(bytes: Buffer): 'png' | 'jpg' {
  return bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ? 'png' : 'jpg';
}
