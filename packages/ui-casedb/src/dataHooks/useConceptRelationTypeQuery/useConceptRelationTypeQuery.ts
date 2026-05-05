import { useMemo } from 'react';
import { CaseDbConceptRelationType } from '@gen-epix/api-casedb';

import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';


export const conceptRelationTypePresentationValues: Partial<Record<CaseDbConceptRelationType, string>> = {
  [CaseDbConceptRelationType.CONTAINS]: 'CONTAINS',
};

export const useConceptRelationTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(conceptRelationTypePresentationValues).map(([value, label]) => ({ label, value }));
    return {
      error: null,
      isLoading: false,
      options,
    } as UseOptions<string>;
  }, []);
};
