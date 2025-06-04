import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DimType } from '../../api';
import { translateOptions } from '../../hooks/useTranslatedOptions';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const dimTypePresentationValues: Record<DimType, string> = {
  [DimType.GEO]: 'GEO',
  [DimType.IDENTIFIER]: 'IDENTIFIER',
  [DimType.NUMBER]: 'NUMBER',
  [DimType.ORGANIZATION]: 'ORGANIZATION',
  [DimType.OTHER]: 'OTHER',
  [DimType.TEXT]: 'TEXT',
  [DimType.TIME]: 'TIME',
};

export const useDimTypeOptions = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(dimTypePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null as UseOptions<string>,
    };
  }, [t]);
};
