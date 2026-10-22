/** A file name safe to write in a folder of its own: the name Jira gave, with no folders and no odd characters, numbered when another took it. */
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
