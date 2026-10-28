/**
 * Um caminho que o git diz que mudou numa cópia: onde está, e se foi mudado, adicionado,
 * apagado, renomeado ou é novo para o git.
 */
export interface IChangedPath {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
}
