import type { SuiteFileStatus } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const SUITE_DIFF = {
  numberWidth: 44,
  statusKeys: {
    modified: 'AUTOMATION.FILE_MODIFIED',
    added: 'AUTOMATION.FILE_ADDED',
    deleted: 'AUTOMATION.FILE_DELETED',
    renamed: 'AUTOMATION.FILE_RENAMED',
  } satisfies Record<SuiteFileStatus, ParseKeys>,
} as const;
