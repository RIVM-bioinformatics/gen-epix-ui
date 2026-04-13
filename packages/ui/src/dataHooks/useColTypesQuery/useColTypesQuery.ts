import { useMemo } from 'react';
import { ColType } from '@gen-epix/api-casedb';

import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const colTypePresentationValues: Record<ColType, string> = {
  [ColType.CONTEXT_FREE_GRAMMAR_JSON]: 'CONTEXT_FREE_GRAMMAR_JSON',
  [ColType.CONTEXT_FREE_GRAMMAR_XML]: 'CONTEXT_FREE_GRAMMAR_XML',
  [ColType.DECIMAL_0]: 'DECIMAL_0',
  [ColType.DECIMAL_1]: 'DECIMAL_1',
  [ColType.DECIMAL_2]: 'DECIMAL_2',
  [ColType.DECIMAL_3]: 'DECIMAL_3',
  [ColType.DECIMAL_4]: 'DECIMAL_4',
  [ColType.DECIMAL_5]: 'DECIMAL_5',
  [ColType.DECIMAL_6]: 'DECIMAL_6',
  [ColType.GENETIC_DISTANCE]: 'GENETIC_DISTANCE',
  [ColType.GENETIC_PROFILE]: 'GENETIC_PROFILE',
  [ColType.GENETIC_READS]: 'GENETIC_READS',
  [ColType.GENETIC_SEQUENCE]: 'GENETIC_SEQUENCE',
  [ColType.GEO_LATLON]: 'GEO_LATLON',
  [ColType.GEO_REGION]: 'GEO_REGION',
  [ColType.ID_CASE]: 'ID_CASE',
  [ColType.ID_EVENT]: 'ID_EVENT',
  [ColType.ID_GENETIC_SEQUENCE]: 'ID_GENETIC_SEQUENCE',
  [ColType.ID_PERSON]: 'ID_PERSON',
  [ColType.ID_SAMPLE]: 'ID_SAMPLE',
  [ColType.INTERVAL]: 'INTERVAL',
  [ColType.NOMINAL]: 'NOMINAL',
  [ColType.ORDINAL]: 'ORDINAL',
  [ColType.ORGANIZATION]: 'ORGANIZATION',
  [ColType.OTHER]: 'OTHER',
  [ColType.REGULAR_LANGUAGE]: 'REGULAR_LANGUAGE',
  [ColType.TEXT]: 'TEXT',
  [ColType.TIME_DAY]: 'TIME_DAY',
  [ColType.TIME_MONTH]: 'TIME_MONTH',
  [ColType.TIME_QUARTER]: 'TIME_QUARTER',
  [ColType.TIME_WEEK]: 'TIME_WEEK',
  [ColType.TIME_YEAR]: 'TIME_YEAR',
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
