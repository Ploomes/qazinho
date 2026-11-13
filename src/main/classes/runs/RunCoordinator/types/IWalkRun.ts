import type { IVariableValue } from '@/main/types';
import type { IStartRun } from '@/shared/types';

export interface IWalkRun extends IStartRun {
  command: string;
  shotDir: string;
  profileDir: string;
  sdkRoot: string;
  avd: string;
  axe: string;
  udid: string;
  values: IVariableValue[];
  uploads: { name: string; path: string }[];
  uploadPath: (file: string) => Promise<string | null>;
  uploadRefs: Map<string, string>;
}
