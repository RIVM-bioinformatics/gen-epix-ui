import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { SeqDbSeqProfileType } from '@gen-epix/api-seqdb';

import {
  seqProfileTypePresentationValues,
  useSeqProfileTypeOptionsQuery,
} from './useSeqProfileTypeOptionsQuery';

describe('useSeqProfileTypeOptionsQuery', () => {
  it('returns options in SDK declaration order with presentation labels', () => {
    const { result } = renderHook(() => useSeqProfileTypeOptionsQuery());

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'SNP', value: SeqDbSeqProfileType.SNP },
        { label: 'LOCUS', value: SeqDbSeqProfileType.LOCUS },
        { label: 'ALLELE', value: SeqDbSeqProfileType.ALLELE },
        { label: 'MLVA', value: SeqDbSeqProfileType.MLVA },
        { label: 'KMER', value: SeqDbSeqProfileType.KMER },
      ],
    });
  });

  it('has a presentation label for every SDK profile type', () => {
    expect(Object.values(seqProfileTypePresentationValues).sort()).toEqual(Object.keys(SeqDbSeqProfileType).sort());
  });
});
