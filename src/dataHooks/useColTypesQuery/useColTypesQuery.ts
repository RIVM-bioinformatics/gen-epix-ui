import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ColType } from '../../api';
import { translateOptions } from '../../hooks/useTranslatedOptions';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const colTypePresentationValues: Record<ColType, string> = {
  [ColType.TEXT]: 'TEXT',
  [ColType.CONTEXT_FREE_GRAMMAR_JSON]: 'CONTEXT_FREE_GRAMMAR_JSON',
  [ColType.CONTEXT_FREE_GRAMMAR_XML]: 'CONTEXT_FREE_GRAMMAR_XML',
  [ColType.REGULAR_LANGUAGE]: 'REGULAR_LANGUAGE',
  [ColType.NOMINAL]: 'NOMINAL',
  [ColType.ORDINAL]: 'ORDINAL',
  [ColType.INTERVAL]: 'INTERVAL',
  [ColType.TIME_DAY]: 'TIME_DAY',
  [ColType.TIME_WEEK]: 'TIME_WEEK',
  [ColType.TIME_MONTH]: 'TIME_MONTH',
  [ColType.TIME_QUARTER]: 'TIME_QUARTER',
  [ColType.TIME_YEAR]: 'TIME_YEAR',
  [ColType.GEO_LATLON]: 'GEO_LATLON',
  [ColType.GEO_REGION]: 'GEO_REGION',
  [ColType.ID_DIRECT]: 'ID_DIRECT',
  [ColType.ID_PSEUDONYMISED]: 'ID_PSEUDONYMISED',
  [ColType.ID_ANONYMISED]: 'ID_ANONYMISED',
  [ColType.DECIMAL_0]: 'DECIMAL_0',
  [ColType.DECIMAL_1]: 'DECIMAL_1',
  [ColType.DECIMAL_2]: 'DECIMAL_2',
  [ColType.DECIMAL_3]: 'DECIMAL_3',
  [ColType.DECIMAL_4]: 'DECIMAL_4',
  [ColType.DECIMAL_5]: 'DECIMAL_5',
  [ColType.DECIMAL_6]: 'DECIMAL_6',
  [ColType.GENETIC_SEQUENCE]: 'GENETIC_SEQUENCE',
  [ColType.GENETIC_DISTANCE]: 'GENETIC_DISTANCE',
  [ColType.ORGANIZATION]: 'ORGANIZATION',
  [ColType.GENETIC_READS]: 'GENETIC_READS',
  [ColType.GENETIC_PROFILE]: 'GENETIC_PROFILE',
  [ColType.OTHER]: 'OTHER',
  [ColType.GENETIC_READS_FWD]: 'GENETIC_READS_FWD',
  [ColType.GENETIC_READS_REV]: 'GENETIC_READS_REV',
};

export const useColTypeOptionsQuery = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(colTypePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null,
    } as UseOptions<string>;
  }, [t]);
};
