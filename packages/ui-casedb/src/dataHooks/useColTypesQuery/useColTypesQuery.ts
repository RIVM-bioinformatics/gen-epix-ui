import { useMemo } from 'react';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  OptionBase,
  UseOptions,
} from '@gen-epix/ui';


export const colTypePresentationValues: Record<CaseDbColType, string> = {
  [CaseDbColType.CONTEXT_FREE_GRAMMAR_JSON]: 'CONTEXT_FREE_GRAMMAR_JSON',
  [CaseDbColType.CONTEXT_FREE_GRAMMAR_XML]: 'CONTEXT_FREE_GRAMMAR_XML',
  [CaseDbColType.DECIMAL_0]: 'DECIMAL_0',
  [CaseDbColType.DECIMAL_1]: 'DECIMAL_1',
  [CaseDbColType.DECIMAL_2]: 'DECIMAL_2',
  [CaseDbColType.DECIMAL_3]: 'DECIMAL_3',
  [CaseDbColType.DECIMAL_4]: 'DECIMAL_4',
  [CaseDbColType.DECIMAL_5]: 'DECIMAL_5',
  [CaseDbColType.DECIMAL_6]: 'DECIMAL_6',
  [CaseDbColType.GENETIC_DISTANCE]: 'GENETIC_DISTANCE',
  [CaseDbColType.GENETIC_PROFILE]: 'GENETIC_PROFILE',
  [CaseDbColType.GENETIC_READS]: 'GENETIC_READS',
  [CaseDbColType.GENETIC_SEQUENCE]: 'GENETIC_SEQUENCE',
  [CaseDbColType.GEO_LATLON]: 'GEO_LATLON',
  [CaseDbColType.GEO_REGION]: 'GEO_REGION',
  [CaseDbColType.ID_CASE]: 'ID_CASE',
  [CaseDbColType.ID_EVENT]: 'ID_EVENT',
  [CaseDbColType.ID_GENETIC_SEQUENCE]: 'ID_GENETIC_SEQUENCE',
  [CaseDbColType.ID_PERSON]: 'ID_PERSON',
  [CaseDbColType.ID_SAMPLE]: 'ID_SAMPLE',
  [CaseDbColType.INTERVAL]: 'INTERVAL',
  [CaseDbColType.NOMINAL]: 'NOMINAL',
  [CaseDbColType.ORDINAL]: 'ORDINAL',
  [CaseDbColType.ORGANIZATION]: 'ORGANIZATION',
  [CaseDbColType.OTHER]: 'OTHER',
  [CaseDbColType.REGULAR_LANGUAGE]: 'REGULAR_LANGUAGE',
  [CaseDbColType.TEXT]: 'TEXT',
  [CaseDbColType.TIME_DAY]: 'TIME_DAY',
  [CaseDbColType.TIME_MONTH]: 'TIME_MONTH',
  [CaseDbColType.TIME_QUARTER]: 'TIME_QUARTER',
  [CaseDbColType.TIME_WEEK]: 'TIME_WEEK',
  [CaseDbColType.TIME_YEAR]: 'TIME_YEAR',
};

export const useColTypeOptionsQuery = (): UseOptions<string> => {
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(colTypePresentationValues).map(([value, label]) => ({ label, value }));
    return {
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options,
    } as UseOptions<string>;
  }, []);
};
