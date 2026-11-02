import type { IStorageUsage } from '@/shared/types';

/** Um jeito de o QAzinho ocupar disco: o que o `IStorageUsage` mede, fora o total. */
export type StorageKind = Exclude<keyof IStorageUsage, 'total'>;
