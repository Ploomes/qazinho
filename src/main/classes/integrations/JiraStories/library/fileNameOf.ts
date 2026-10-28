/**
 * Um nome de arquivo seguro de escrever numa pasta própria: o nome que o Jira deu, sem
 * pastas e sem caracteres estranhos, numerado quando outro o tomou.
 */
export function fileNameOf(props: { filename: string; taken: string[] }): string {
  const plain =
    (props.filename.split(/[\\/]/).at(-1) ?? '')
      .replace(/[^\w.\- ()]+/g, '_')
      .replace(/^\.+/, '')
      .trim() || 'file';
  const dot = plain.lastIndexOf('.');
  const stem = dot > 0 ? plain.slice(0, dot) : plain;
  const extension = dot > 0 ? plain.slice(dot) : '';
  let name = plain;

  for (let number = 2; props.taken.includes(name.toLowerCase()); number += 1)
    name = `${stem} (${String(number)})${extension}`;

  return name;
}
