import { useMemo } from 'react';
import { CaseDbTreeAlgorithmType } from '@gen-epix/api-casedb';

import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const treeAlgorithmCodeValues: Record<CaseDbTreeAlgorithmType, string> = {
  [CaseDbTreeAlgorithmType.BAYESIAN_INFERENCE]: 'BAYESIAN_INFERENCE',
  [CaseDbTreeAlgorithmType.CLINK]: 'CLINK',
  [CaseDbTreeAlgorithmType.FITCH_MARGOLIASH]: 'FITCH_MARGOLIASH',
  [CaseDbTreeAlgorithmType.HAUSDORFF]: 'HAUSDORFF',
  [CaseDbTreeAlgorithmType.MAX_PARSIMONY]: 'MAX_PARSIMONY',
  [CaseDbTreeAlgorithmType.MEDOID]: 'MEDOID',
  [CaseDbTreeAlgorithmType.MIN_ENERGY]: 'MIN_ENERGY',
  [CaseDbTreeAlgorithmType.MIN_SPANNING]: 'MIN_SPANNING',
  [CaseDbTreeAlgorithmType.MIN_SUM_INCREASE_MEDOID]: 'MIN_SUM_INCREASE_MEDOID',
  [CaseDbTreeAlgorithmType.MIN_SUM_MEDOID]: 'MIN_SUM_MEDOID',
  [CaseDbTreeAlgorithmType.MINI_MAX]: 'MINI_MAX',
  [CaseDbTreeAlgorithmType.MISSQ]: 'MISSQ',
  [CaseDbTreeAlgorithmType.MIVAR]: 'MIVAR',
  [CaseDbTreeAlgorithmType.ML]: 'ML',
  [CaseDbTreeAlgorithmType.MNSSQ]: 'MNSSQ',
  [CaseDbTreeAlgorithmType.MNVAR]: 'MNVAR',
  [CaseDbTreeAlgorithmType.NJ]: 'NJ',
  [CaseDbTreeAlgorithmType.SLINK]: 'SLINK',
  [CaseDbTreeAlgorithmType.UPGMA]: 'UPGMA',
  [CaseDbTreeAlgorithmType.UPGMC]: 'UPGMC',
  [CaseDbTreeAlgorithmType.VERSATILE]: 'VERSATILE',
  [CaseDbTreeAlgorithmType.WPGMA]: 'WPGMA',
  [CaseDbTreeAlgorithmType.WPGMC]: 'WPGMC',
};

export const useTreeAlgorithmCodeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(treeAlgorithmCodeValues).map(([value, label]) => ({ label, value }));
    return {
      error: null as UseOptions<string>,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options,
    };
  }, []);
};
