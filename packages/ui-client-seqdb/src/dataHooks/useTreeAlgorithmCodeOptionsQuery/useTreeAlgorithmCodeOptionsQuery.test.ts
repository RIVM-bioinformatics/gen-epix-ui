import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { SeqDbGenEpixSeqdbDomainTreeAlgorithm } from '@gen-epix/api-seqdb';

import {
  treeAlgorithmCodePresentationValues,
  useTreeAlgorithmCodeOptionsQuery,
} from './useTreeAlgorithmCodeOptionsQuery';

describe('useTreeAlgorithmCodeOptionsQuery', () => {
  it('returns options in SDK declaration order with presentation labels', () => {
    const { result } = renderHook(() => useTreeAlgorithmCodeOptionsQuery());

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'SLINK', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.SLINK },
        { label: 'CLINK', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.CLINK },
        { label: 'UPGMA', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.UPGMA },
        { label: 'WPGMA', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.WPGMA },
        { label: 'UPGMC', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.UPGMC },
        { label: 'WPGMC', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.WPGMC },
        { label: 'VERSATILE', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.VERSATILE },
        { label: 'MISSQ', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MISSQ },
        { label: 'MNSSQ', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MNSSQ },
        { label: 'MIVAR', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MIVAR },
        { label: 'MNVAR', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MNVAR },
        { label: 'MINI_MAX', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MINI_MAX },
        { label: 'HAUSDORFF', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.HAUSDORFF },
        { label: 'MIN_SUM_MEDOID', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MIN_SUM_MEDOID },
        { label: 'MIN_SUM_INCREASE_MEDOID', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MIN_SUM_INCREASE_MEDOID },
        { label: 'MEDOID', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MEDOID },
        { label: 'MIN_ENERGY', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MIN_ENERGY },
        { label: 'FITCH_MARGOLIASH', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.FITCH_MARGOLIASH },
        { label: 'MAX_PARSIMONY', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MAX_PARSIMONY },
        { label: 'ML', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.ML },
        { label: 'BAYESIAN_INFERENCE', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.BAYESIAN_INFERENCE },
        { label: 'MIN_SPANNING', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.MIN_SPANNING },
        { label: 'NJ', value: SeqDbGenEpixSeqdbDomainTreeAlgorithm.NJ },
      ],
    });
  });

  it('has a presentation label for every SDK tree algorithm', () => {
    expect(Object.values(treeAlgorithmCodePresentationValues).sort()).toEqual(
      Object.keys(SeqDbGenEpixSeqdbDomainTreeAlgorithm).sort(),
    );
  });
});
