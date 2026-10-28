import type { SYNCED_PROJECTS_SCHEMA } from '@/main/classes/pro/ProApi/constants';
import type { z } from 'zod';

/** Um projeto como a org o responde, com os planos dele, para esta máquina baixar. */
export type SyncedProject = z.infer<typeof SYNCED_PROJECTS_SCHEMA>['projects'][number];
