/**
 * Um plano que o QA pediu contra um design do Figma: como o design se chama, o nó que o
 * link dele nomeia, e onde ele abre.
 */
export interface IFigmaCommand {
  id: 'figma-plan';
  name: string;
  nodeId: string | null;
  url: string;
}
