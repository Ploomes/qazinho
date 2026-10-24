import type { SYNCED_PROJECTS_SCHEMA } from '@/main/classes/pro/ProApi/constants';
import type { z } from 'zod';

/** One project as the org answers it, with its plans, for this machine to download. */
export type SyncedProject = z.infer<typeof SYNCED_PROJECTS_SCHEMA>['projects'][number];
