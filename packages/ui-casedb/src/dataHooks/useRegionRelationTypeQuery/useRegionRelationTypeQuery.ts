import { useMemo } from 'react';
import { CaseDbRegionRelationType } from '@gen-epix/api-casedb';
import type {
  OptionBase,
  UseOptions,
} from '@gen-epix/ui';


export const regionRelationTypePresentationValues: Partial<Record<CaseDbRegionRelationType, string>> = {
  [CaseDbRegionRelationType.CONTAINS]: 'CONTAINS',
  [CaseDbRegionRelationType.IS_ADJACENT_TO]: 'IS_ADJACENT_TO',
  [CaseDbRegionRelationType.IS_SEPARATE_FROM]: 'IS_SEPARATE_FROM',
  [CaseDbRegionRelationType.OVERLAPS_WITH]: 'OVERLAPS_WITH',
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
