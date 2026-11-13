/**
 * Os arquivos que uma comparação do GitHub entre dois commits mudou, cada um com o patch
 * cortado, até um tanto de arquivos.
 */
export function filesOfCompare(props: {
  text: string;
  files: number;
  patchLines: number;
}): { path: string; patch: string }[] {
  const { files } = (jsonOf(props.text) ?? {}) as { files?: unknown };

  return (Array.isArray(files) ? files : [])
    .flatMap((file) => {
      const { filename, patch } = (file ?? {}) as { filename?: unknown; patch?: unknown };

      return typeof filename === 'string'
        ? [
            {
              path: filename,
              patch:
                typeof patch === 'string'
                  ? patch.split('\n').slice(0, props.patchLines).join('\n')
                  : '',
            },
          ]
        : [];
    })
    .slice(0, props.files);
}

function jsonOf(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
