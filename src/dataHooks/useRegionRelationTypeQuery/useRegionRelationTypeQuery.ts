import { useMemo } from 'react';

import { RegionRelationType } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';


export const regionRelationTypePresentationValues: Partial<Record<RegionRelationType, string>> = {
  [RegionRelationType.CONTAINS]: 'CONTAINS',
  [RegionRelationType.IS_SEPARATE_FROM]: 'IS_SEPARATE_FROM',
  [RegionRelationType.IS_ADJACENT_TO]: 'IS_ADJACENT_TO',
  [RegionRelationType.OVERLAPS_WITH]: 'OVERLAPS_WITH',
};

export const useRegionRelationTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(regionRelationTypePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options,
      error: null,
    } as UseOptions<string>;
  }, []);
};
