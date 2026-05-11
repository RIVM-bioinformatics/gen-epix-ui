import { useMemo } from 'react';
import { CaseDbConceptSetType } from '@gen-epix/api-casedb';
import type {
  OptionBase,
  UseOptions,
} from '@gen-epix/ui';


export const conceptSetTypePresentationValues: Partial<Record<CaseDbConceptSetType, string>> = {
  [CaseDbConceptSetType.CONTEXT_FREE_GRAMMAR_JSON]: 'CONTEXT_FREE_GRAMMAR_JSON',
  [CaseDbConceptSetType.CONTEXT_FREE_GRAMMAR_XML]: 'CONTEXT_FREE_GRAMMAR_XML',
  [CaseDbConceptSetType.INTERVAL]: 'INTERVAL',
  [CaseDbConceptSetType.NOMINAL]: 'NOMINAL',
  [CaseDbConceptSetType.ORDINAL]: 'ORDINAL',
  [CaseDbConceptSetType.REGULAR_LANGUAGE]: 'REGULAR_LANGUAGE',

};

export const useConceptSetTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(conceptSetTypePresentationValues).map(([value, label]) => ({ label, value }));
    return {
      error: null,
      isLoading: false,
      options,
    } as UseOptions<string>;
  }, []);
};
