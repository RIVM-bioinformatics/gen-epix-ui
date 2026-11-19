import type { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';

export const SEQDB_QUERY_KEY = {
  ALLELES: 'ALLELES',
  FOO: 'FOO',
  LOCI: 'LOCI',
} as const;

// eslint-disable-next-line no-redeclare, @typescript-eslint/naming-convention
export type SEQDB_QUERY_KEY = typeof SEQDB_QUERY_KEY[keyof typeof SEQDB_QUERY_KEY];

/**
 * Every SEQDB_QUERY_KEY needs an entry. `[A]: [B, C]` means a change to either
 * B or C invalidates A. Use `[]` when no other key affects A's cached result.
 */
export const SEQDB_QUERY_DEPENDENCIES: Record<SEQDB_QUERY_KEY, (COMMON_QUERY_KEY | SEQDB_QUERY_KEY)[]> = {
  [SEQDB_QUERY_KEY.ALLELES]: [],
  [SEQDB_QUERY_KEY.FOO]: [],
  [SEQDB_QUERY_KEY.LOCI]: [],
};
