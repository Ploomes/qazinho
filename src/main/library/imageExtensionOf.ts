const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

/** The extension an image's own bytes call for: a phone's screenshot is a PNG, Chrome's a JPEG. */
export function imageExtensionOf(bytes: Buffer): 'png' | 'jpg' {
  return bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ? 'png' : 'jpg';
}
