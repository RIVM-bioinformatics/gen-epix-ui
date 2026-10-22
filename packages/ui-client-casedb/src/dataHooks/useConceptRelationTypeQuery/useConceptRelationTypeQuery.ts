import { useMemo } from 'react';
import { CaseDbConceptRelationType } from '@gen-epix/api-casedb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

export const conceptRelationTypePresentationValues: Partial<Record<CaseDbConceptRelationType, string>> = {
  [CaseDbConceptRelationType.CONTAINS]: 'CONTAINS',
};

export const useConceptRelationTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo<UseOptions<string>>(() => {
    const options: OptionBase<string>[] = Object.entries(conceptRelationTypePresentationValues).map(([value, label]) => ({ label, value }));
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
