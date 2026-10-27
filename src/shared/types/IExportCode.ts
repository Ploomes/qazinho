import type { IFlatStep } from './IFlatStep';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IViewport } from './IViewport';

/**
 * What exporting a workspace's recorded cases as code needs: its plan as a run walks it,
 * the app, and the size the QA runs the web at.
 */
export interface IExportCode {
  workspaceId: string;
  target: ITargetUnderTest;
  viewport: IViewport;
  steps: IFlatStep[];
}
