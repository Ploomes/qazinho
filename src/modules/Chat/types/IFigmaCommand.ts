/**
 * A plan the QA asked for against a Figma design: what the design is called, the node its
 * link names, and where it opens.
 */
export interface IFigmaCommand {
  id: 'figma-plan';
  name: string;
  nodeId: string | null;
  url: string;
}
