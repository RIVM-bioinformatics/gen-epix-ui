import type { COMMON_QUERY_KEY } from '@gen-epix/ui';

export const SEQDB_QUERY_KEY = {
  FOO: 'FOO',
} as const;

// eslint-disable-next-line no-redeclare, @typescript-eslint/naming-convention
export type SEQDB_QUERY_KEY = typeof SEQDB_QUERY_KEY[keyof typeof SEQDB_QUERY_KEY];

export const SEQDB_QUERY_DEPENDENCIES: Record<SEQDB_QUERY_KEY, (COMMON_QUERY_KEY | SEQDB_QUERY_KEY)[]> = {
  [SEQDB_QUERY_KEY.FOO]: [],
};
