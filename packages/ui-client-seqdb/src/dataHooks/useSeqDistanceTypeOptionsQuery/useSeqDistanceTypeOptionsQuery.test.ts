import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { SeqDbSeqDistanceType } from '@gen-epix/api-seqdb';

import {
  seqDistanceTypePresentationValues,
  useSeqDistanceTypeOptionsQuery,
} from './useSeqDistanceTypeOptionsQuery';

describe('useSeqDistanceTypeOptionsQuery', () => {
  it('returns options in SDK declaration order with presentation labels', () => {
    const { result } = renderHook(() => useSeqDistanceTypeOptionsQuery());

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'SNP_HAMMING', value: SeqDbSeqDistanceType.SNP_HAMMING },
        { label: 'ALLELE_HAMMING', value: SeqDbSeqDistanceType.ALLELE_HAMMING },
        { label: 'MLVA_HAMMING', value: SeqDbSeqDistanceType.MLVA_HAMMING },
        { label: 'MLVA_EUCLIDEAN', value: SeqDbSeqDistanceType.MLVA_EUCLIDEAN },
        { label: 'KMER_EUCLIDEAN', value: SeqDbSeqDistanceType.KMER_EUCLIDEAN },
      ],
    });
  });

  it('has a presentation label for every SDK distance type', () => {
    expect(Object.values(seqDistanceTypePresentationValues).sort()).toEqual(Object.keys(SeqDbSeqDistanceType).sort());
  });
});
