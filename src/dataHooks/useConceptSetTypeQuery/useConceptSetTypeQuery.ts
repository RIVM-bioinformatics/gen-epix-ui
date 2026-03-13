import { useMemo } from 'react';

import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';
import { ConceptSetType } from '../../api';


export const conceptSetTypePresentationValues: Partial<Record<ConceptSetType, string>> = {
  [ConceptSetType.CONTEXT_FREE_GRAMMAR_JSON]: 'CONTEXT_FREE_GRAMMAR_JSON',
  [ConceptSetType.CONTEXT_FREE_GRAMMAR_XML]: 'CONTEXT_FREE_GRAMMAR_XML',
  [ConceptSetType.REGULAR_LANGUAGE]: 'REGULAR_LANGUAGE',
  [ConceptSetType.NOMINAL]: 'NOMINAL',
  [ConceptSetType.ORDINAL]: 'ORDINAL',
  [ConceptSetType.INTERVAL]: 'INTERVAL',

};

export const useConceptSetTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(conceptSetTypePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options,
      error: null,
    } as UseOptions<string>;
  }, []);
};
