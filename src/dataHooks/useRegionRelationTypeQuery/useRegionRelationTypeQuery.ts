import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RegionRelationType } from '../../api';
import { translateOptions } from '../../hooks/useTranslatedOptions';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';


export const regionRelationTypePresentationValues: Partial<Record<RegionRelationType, string>> = {
  [RegionRelationType.CONTAINS]: 'CONTAINS',
  [RegionRelationType.IS_SEPARATE_FROM]: 'IS_SEPARATE_FROM',
  [RegionRelationType.IS_ADJACENT_TO]: 'IS_ADJACENT_TO',
  [RegionRelationType.OVERLAPS_WITH]: 'OVERLAPS_WITH',
};

export const useRegionRelationTypeOptionsQuery = (): UseOptions<string> => {
  const { t } = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(regionRelationTypePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null,
    } as UseOptions<string>;
  }, [t]);
};
