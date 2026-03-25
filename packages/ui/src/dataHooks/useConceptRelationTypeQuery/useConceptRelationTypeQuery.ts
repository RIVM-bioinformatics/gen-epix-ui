import { useMemo } from 'react';

import { ConceptRelationType } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';


export const conceptRelationTypePresentationValues: Partial<Record<ConceptRelationType, string>> = {
  [ConceptRelationType.CONTAINS]: 'CONTAINS',
};

export const useConceptRelationTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(conceptRelationTypePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options,
      error: null,
    } as UseOptions<string>;
  }, []);
};
