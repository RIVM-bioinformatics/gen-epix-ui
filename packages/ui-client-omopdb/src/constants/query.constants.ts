import type { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';

export const OMOPDB_QUERY_KEY = {
  FOO: 'FOO',
} as const;

// eslint-disable-next-line no-redeclare, @typescript-eslint/naming-convention
export type OMOPDB_QUERY_KEY = typeof OMOPDB_QUERY_KEY[keyof typeof OMOPDB_QUERY_KEY];

/**
 * Every OMOPDB_QUERY_KEY needs an entry. `[A]: [B, C]` means a change to either
 * B or C invalidates A. Use `[]` when no other key affects A's cached result.
 */
export const OMOPDB_QUERY_DEPENDENCIES: Record<OMOPDB_QUERY_KEY, (COMMON_QUERY_KEY | OMOPDB_QUERY_KEY)[]> = {
  [OMOPDB_QUERY_KEY.FOO]: [],
};
