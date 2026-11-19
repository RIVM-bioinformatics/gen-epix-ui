import { useMemo } from 'react';
import type { SeqDbGenEpixSeqdbDomainTreeAlgorithm } from '@gen-epix/api-seqdb';
import { SeqDbGenEpixSeqdbDomainTreeAlgorithm as SeqDbTreeAlgorithmValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

export const treeAlgorithmCodePresentationValues: Record<SeqDbGenEpixSeqdbDomainTreeAlgorithm, string> = {
  [SeqDbTreeAlgorithmValues.BAYESIAN_INFERENCE]: 'BAYESIAN_INFERENCE',
  [SeqDbTreeAlgorithmValues.CLINK]: 'CLINK',
  [SeqDbTreeAlgorithmValues.FITCH_MARGOLIASH]: 'FITCH_MARGOLIASH',
  [SeqDbTreeAlgorithmValues.HAUSDORFF]: 'HAUSDORFF',
  [SeqDbTreeAlgorithmValues.MAX_PARSIMONY]: 'MAX_PARSIMONY',
  [SeqDbTreeAlgorithmValues.MEDOID]: 'MEDOID',
  [SeqDbTreeAlgorithmValues.MIN_ENERGY]: 'MIN_ENERGY',
  [SeqDbTreeAlgorithmValues.MIN_SPANNING]: 'MIN_SPANNING',
  [SeqDbTreeAlgorithmValues.MIN_SUM_INCREASE_MEDOID]: 'MIN_SUM_INCREASE_MEDOID',
  [SeqDbTreeAlgorithmValues.MIN_SUM_MEDOID]: 'MIN_SUM_MEDOID',
  [SeqDbTreeAlgorithmValues.MINI_MAX]: 'MINI_MAX',
  [SeqDbTreeAlgorithmValues.MISSQ]: 'MISSQ',
  [SeqDbTreeAlgorithmValues.MIVAR]: 'MIVAR',
  [SeqDbTreeAlgorithmValues.ML]: 'ML',
  [SeqDbTreeAlgorithmValues.MNSSQ]: 'MNSSQ',
  [SeqDbTreeAlgorithmValues.MNVAR]: 'MNVAR',
  [SeqDbTreeAlgorithmValues.NJ]: 'NJ',
  [SeqDbTreeAlgorithmValues.SLINK]: 'SLINK',
  [SeqDbTreeAlgorithmValues.UPGMA]: 'UPGMA',
  [SeqDbTreeAlgorithmValues.UPGMC]: 'UPGMC',
  [SeqDbTreeAlgorithmValues.VERSATILE]: 'VERSATILE',
  [SeqDbTreeAlgorithmValues.WPGMA]: 'WPGMA',
  [SeqDbTreeAlgorithmValues.WPGMC]: 'WPGMC',
};

export const useTreeAlgorithmCodeOptionsQuery = (): UseOptions<SeqDbGenEpixSeqdbDomainTreeAlgorithm> => {
  return useMemo<UseOptions<SeqDbGenEpixSeqdbDomainTreeAlgorithm>>(() => {
    const options: OptionBase<SeqDbGenEpixSeqdbDomainTreeAlgorithm>[] = Object.values(SeqDbTreeAlgorithmValues).map(value => ({
      label: treeAlgorithmCodePresentationValues[value],
      value,
    }));

    return {
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options,
    };
  }, []);
};
