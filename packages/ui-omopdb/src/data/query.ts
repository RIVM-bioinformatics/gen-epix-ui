import type { COMMON_QUERY_KEY } from '@gen-epix/ui';

export const OMOPDB_QUERY_KEY = {
  FOO: 'FOO',
} as const;

// eslint-disable-next-line no-redeclare, @typescript-eslint/naming-convention
export type OMOPDB_QUERY_KEY = typeof OMOPDB_QUERY_KEY[keyof typeof OMOPDB_QUERY_KEY];

export const OMOPDB_QUERY_DEPENDENCIES: Record<OMOPDB_QUERY_KEY, (COMMON_QUERY_KEY | OMOPDB_QUERY_KEY)[]> = {
  [OMOPDB_QUERY_KEY.FOO]: [],
};
