import type { IFlatStep } from './IFlatStep';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IViewport } from './IViewport';

/**
 * O que exportar os casos gravados de um workspace como código precisa: o plano como uma
 * run o anda, o app, e o tamanho em que o QA roda a web.
 */
export interface IExportCode {
  workspaceId: string;
  target: ITargetUnderTest;
  viewport: IViewport;
  steps: IFlatStep[];
}
