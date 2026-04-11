import { useMemo } from 'react';

import { RegionRelationType } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';


export const regionRelationTypePresentationValues: Partial<Record<RegionRelationType, string>> = {
  [RegionRelationType.CONTAINS]: 'CONTAINS',
  [RegionRelationType.IS_ADJACENT_TO]: 'IS_ADJACENT_TO',
  [RegionRelationType.IS_SEPARATE_FROM]: 'IS_SEPARATE_FROM',
  [RegionRelationType.OVERLAPS_WITH]: 'OVERLAPS_WITH',
};

export const useRegionRelationTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(regionRelationTypePresentationValues).map(([value, label]) => ({ label, value }));
    return {
      error: null,
      isLoading: false,
      options,
    } as UseOptions<string>;
  }, []);
};
