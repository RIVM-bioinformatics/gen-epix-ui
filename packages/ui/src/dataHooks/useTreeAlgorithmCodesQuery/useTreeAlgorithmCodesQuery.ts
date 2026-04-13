import { useMemo } from 'react';
import { TreeAlgorithmType } from '@gen-epix/api-casedb';

import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const treeAlgorithmCodeValues: Record<TreeAlgorithmType, string> = {
  [TreeAlgorithmType.BAYESIAN_INFERENCE]: 'BAYESIAN_INFERENCE',
  [TreeAlgorithmType.CLINK]: 'CLINK',
  [TreeAlgorithmType.FITCH_MARGOLIASH]: 'FITCH_MARGOLIASH',
  [TreeAlgorithmType.HAUSDORFF]: 'HAUSDORFF',
  [TreeAlgorithmType.MAX_PARSIMONY]: 'MAX_PARSIMONY',
  [TreeAlgorithmType.MEDOID]: 'MEDOID',
  [TreeAlgorithmType.MIN_ENERGY]: 'MIN_ENERGY',
  [TreeAlgorithmType.MIN_SPANNING]: 'MIN_SPANNING',
  [TreeAlgorithmType.MIN_SUM_INCREASE_MEDOID]: 'MIN_SUM_INCREASE_MEDOID',
  [TreeAlgorithmType.MIN_SUM_MEDOID]: 'MIN_SUM_MEDOID',
  [TreeAlgorithmType.MINI_MAX]: 'MINI_MAX',
  [TreeAlgorithmType.MISSQ]: 'MISSQ',
  [TreeAlgorithmType.MIVAR]: 'MIVAR',
  [TreeAlgorithmType.ML]: 'ML',
  [TreeAlgorithmType.MNSSQ]: 'MNSSQ',
  [TreeAlgorithmType.MNVAR]: 'MNVAR',
  [TreeAlgorithmType.NJ]: 'NJ',
  [TreeAlgorithmType.SLINK]: 'SLINK',
  [TreeAlgorithmType.UPGMA]: 'UPGMA',
  [TreeAlgorithmType.UPGMC]: 'UPGMC',
  [TreeAlgorithmType.VERSATILE]: 'VERSATILE',
  [TreeAlgorithmType.WPGMA]: 'WPGMA',
  [TreeAlgorithmType.WPGMC]: 'WPGMC',
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
