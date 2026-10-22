import { useMemo } from 'react';
import { CaseDbRegionRelationType } from '@gen-epix/api-casedb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';


export const regionRelationTypePresentationValues: Partial<Record<CaseDbRegionRelationType, string>> = {
  [CaseDbRegionRelationType.CONTAINS]: 'CONTAINS',
  [CaseDbRegionRelationType.IS_ADJACENT_TO]: 'IS_ADJACENT_TO',
  [CaseDbRegionRelationType.IS_SEPARATE_FROM]: 'IS_SEPARATE_FROM',
  [CaseDbRegionRelationType.OVERLAPS_WITH]: 'OVERLAPS_WITH',
};

export const useRegionRelationTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo<UseOptions<string>>(() => {
    const options: OptionBase<string>[] = Object.entries(regionRelationTypePresentationValues).map(([value, label]) => ({ label, value }));
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
