import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ConceptRelationType } from '../../api';
import { translateOptions } from '../../hooks/useTranslatedOptions';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';


export const conceptRelationTypePresentationValues: Partial<Record<ConceptRelationType, string>> = {
  [ConceptRelationType.CONTAINS]: 'CONTAINS',
  [ConceptRelationType.IS_CONTAINED_IN]: 'IS_CONTAINED_IN',
};

export const useConceptRelationTypeOptionsQuery = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(conceptRelationTypePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null,
    } as UseOptions<string>;
  }, [t]);
};
